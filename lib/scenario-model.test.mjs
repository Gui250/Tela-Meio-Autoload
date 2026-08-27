// Sanity check for the queue model: node lib/scenario-model.test.mjs
// Kept dependency-free — the arithmetic is what matters, not the TS types.
import assert from "node:assert/strict";

const BASE_ARRIVAL = 18;
const CHAIN = [
  ["agendamento", 60], ["checkin", 30], ["filas", 40],
  ["pesagem", 28], ["inspecao", 26], ["carga-descarga", 24], ["estoque", 60],
];

function simulate({ arrivalFactor = 1, capacityFactors = {}, rework }) {
  const impacts = new Map();
  let arrival = BASE_ARRIVAL * arrivalFactor;
  let cycle = 0;
  for (const [id, nominal] of CHAIN) {
    const capacity = nominal * (capacityFactors[id] ?? 1);
    const passes = rework?.stageId === id ? 1 + rework.share : 1;
    const u = (arrival * passes) / capacity;
    const service = 60 / capacity;
    const stable = u < 0.995;
    const throughput = Math.min(arrival, capacity / passes);
    impacts.set(id, {
      u, throughput,
      wait: stable ? (u / (1 - u)) * service : null,
      status: !stable || u >= 0.92 ? "critico" : u >= 0.8 ? "atencao" : "ok",
    });
    cycle = cycle === null || !stable ? null : cycle + impacts.get(id).wait + service;
    arrival = throughput;
  }
  return { impacts, perDay: Math.round(arrival * 24), cycle };
}

const normal = simulate({});
assert.equal([...normal.impacts.values()].every((s) => s.status === "ok"), true, "baseline must have no station in trouble");
assert.equal(normal.perDay, 432, "baseline clears every truck that arrives");
assert.ok(normal.cycle > 20 && normal.cycle < 45, `baseline cycle out of range: ${normal.cycle}`);

// A capacity cut below the arrival rate must not report a finite wait.
const balanca = simulate({ capacityFactors: { pesagem: 0.55 } });
assert.equal(balanca.impacts.get("pesagem").wait, null, "saturated station must not report a wait");
assert.equal(balanca.cycle, null, "cycle time is undefined once a station saturates");
assert.ok(balanca.perDay < normal.perDay, "a saturated station must cut daily throughput");

// A severe but sub-capacity constraint costs time, not volume.
const tanque = simulate({ capacityFactors: { "carga-descarga": 0.8 } });
assert.equal(tanque.perDay, normal.perDay, "below capacity, every truck is still cleared");
assert.ok(tanque.cycle > normal.cycle * 2, "but the cycle time must blow up");
assert.equal(tanque.impacts.get("carga-descarga").status, "critico");

// Rework loads one station without touching what leaves the terminal.
const inspecao = simulate({ rework: { stageId: "inspecao", share: 0.18 } });
assert.equal(inspecao.perDay, normal.perDay);
assert.equal(inspecao.impacts.get("inspecao").status, "atencao");
assert.equal(inspecao.impacts.get("pesagem").status, "ok", "rework must stay local to its station");

// More arrivals push the tightest station over first.
const pico = simulate({ arrivalFactor: 1.3 });
assert.equal(pico.impacts.get("carga-descarga").status, "critico");
assert.ok(pico.perDay > normal.perDay, "extra demand still clears more trucks, just slower");

console.log("scenario model ok");
