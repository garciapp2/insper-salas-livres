import axios from "axios";
import { DateTime } from "luxon";
import type { NextApiRequest, NextApiResponse } from "next";
import { parseStringPromise } from "xml2js";
import { CalendarioEvento, RootAlocacao } from "../../types";

const ignoredRooms = [
  "AULA REMOTA",
  "",
  "HUB DE INOVAÇÃO - TÉRREO - PRÉDIO 2",
  "REUNIÃO 732",
];

const ignoredPrefixes = [
  "REUNIÃO",
  "9"
]

// IMPORTANTE: Horários sempre em UTC
const roomClosingTimes: {
  [key: string]: [number, number, number, number];
} = {
  "404 - LABORATÓRIO DE INFORMÁTICA": [20 + 3, 0, 0, 0],
  "LABORATÓRIO DESENVOLVIMENTO COLABORATIVO ÁGIL 1": [22 + 3, 50, 0, 0],
  "LABORATÓRIO DESENVOLVIMENTO COLABORATIVO ÁGIL 2": [22 + 3, 50, 0, 0],
};

const displayNames: {
  [key: string]: string;
} = {
  "LABORATÓRIO DESENVOLVIMENTO COLABORATIVO ÁGIL 1": "LAB. ÁGIL 1",
  "LABORATÓRIO DESENVOLVIMENTO COLABORATIVO ÁGIL 2": "LAB. ÁGIL 2",
  "403 - LABORATÓRIO DE SISTEMAS ELETRÔNICOS": "LAB. SISTEMAS MECATRÔNICOS"
};

// Não mande um User-Agent de navegador aqui: o WAF do Insper responde 403 para
// UAs que parecem browser. O User-Agent padrão do axios passa normalmente.
const CALENDARIO_URL =
  "https://cgi.insper.edu.br/agenda/xml/ExibeCalendario.xml";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const calendario = await axios.get(CALENDARIO_URL);

  const calendarioJson: RootAlocacao = await parseStringPromise(
    calendario.data
  );

  const calendarioFixed = calendarioJson.ControleAlocacao.CalendarioEvento.map(
    (evento: CalendarioEvento) => {
      // Turn a string in format HH:MM into a Date object
      const dataSplit = evento.data[0].split("/");

      const horaInicio = new Date(
        `${dataSplit[2]}-${dataSplit[1]}-${dataSplit[0]}T${evento.horainicio[0]}:00.000-0300`
      );
      const horaTermino = new Date(
        `${dataSplit[2]}-${dataSplit[1]}-${dataSplit[0]}T${evento.horatermino[0]}:00.000-0300`
      );

      return {
        data: evento.data[0],
        hora_inicio: horaInicio,
        hora_termino: horaTermino,
        titulo: evento.titulo[0],
        sala: evento.sala[0],
        andar: evento.andar[0],
        predio: evento.predio[0],
        cancelada: evento.cancelada[0] === "S",
      };
    }
  )
    .filter((evento) => evento.cancelada === false)
    .filter(evento => !ignoredRooms.includes(evento.sala))
    .filter(evento => !ignoredPrefixes.some(prefix => evento.sala.startsWith(prefix)))

  // A agenda publica um dia por vez e só vira de madrugada. Com os eventos de
  // outro dia, toda sala pareceria livre e o "livre até" cairia no fechamento
  // de hoje — um horário inventado. Nesse caso não se responde disponibilidade.
  const hoje = DateTime.now().setZone("America/Sao_Paulo").toFormat("dd/MM/yyyy");
  const dataAgenda = calendarioFixed[0]?.data ?? null;
  const atual = dataAgenda === hoje;

  if (!atual) {
    res.status(200).json({
      atual: false,
      dataAgenda,
      hoje,
      salas: [],
    });
    return;
  }

  const rightNow = new Date();

  const salasUnicas = [
    ...new Set(calendarioFixed.map((evento) => evento.sala)),
  ].map((nomeSala) => {
    const sala = calendarioFixed.find((evento) => evento.sala === nomeSala)!;
    return {
      nome: sala.sala,
      predio: sala.predio,
      andar: sala.andar,
    };
  });

  const salasLivres = salasUnicas
    .map(sala => ({
      ...sala,
      eventosAgora: calendarioFixed.filter(
        (evento) => evento.sala === sala.nome
      ).filter((evento) => {
        return (
          evento.hora_inicio.getTime() <= rightNow.getTime() &&
          evento.hora_termino.getTime() >= rightNow.getTime()
        );
      })
    }))
    .map(sala => ({
      ...sala,
      forStudies: sala.eventosAgora.some(evento => evento.titulo === 'SALA DE ESTUDOS'),
      forStudiesUntil: sala.eventosAgora.filter(evento => evento.titulo === 'SALA DE ESTUDOS').sort((a, b) => a.hora_inicio.getTime() - b.hora_inicio.getTime())[0]?.hora_termino
    }))
    .filter((sala) => {
      return sala.eventosAgora.length === 0 || sala.forStudies;
    })
    .map((salaLivre) => {
      const nextEvent = calendarioFixed
        .filter((evento) => evento.hora_inicio.getTime() > rightNow.getTime())
        .filter((evento) => evento.sala === salaLivre.nome)
        .sort((a, b) => a.hora_inicio.getTime() - b.hora_inicio.getTime())[0];

      const buildingClosingTime = new Date();
      if (rightNow.getDay() === 6) {
        buildingClosingTime.setUTCHours(20 + 3, 0, 0, 0);
      } else {
        buildingClosingTime.setUTCHours(23 + 3, 0, 0, 0);
      }

      let roomClosingTime = buildingClosingTime;
      if (roomClosingTimes[salaLivre.nome]) {
        roomClosingTime = new Date();
        roomClosingTime.setUTCHours(...roomClosingTimes[salaLivre.nome]);
      }

      const todayEventCount = calendarioFixed.filter(
        (evento) => evento.sala === salaLivre.nome && evento.titulo !== 'SALA DE ESTUDOS'
      ).length

      return {
        ...salaLivre,
        nextEvent: nextEvent ? nextEvent.titulo : null,
        freeUntil: nextEvent ? nextEvent.hora_inicio : roomClosingTime,
        todayEventCount,
      };
    })
    .filter((sala) => sala.freeUntil > rightNow)
    .map((sala) => {
      return {
        ...sala,
        nome: displayNames[sala.nome] || sala.nome,
        eventosAgora: undefined,
      };
    })

  res.status(200).json({
    atual: true,
    dataAgenda,
    hoje,
    salas: salasLivres,
  });
}
