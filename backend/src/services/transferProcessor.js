'use strict';

const { collection } = require('../lib/store');
const { emitToRooms } = require('../realtime/socket');

const transfers = () => collection('transfers');

/** Rooms that should receive updates for a given transfer (de-duplicated by socket.io). */
function roomsFor(transfer) {
  const rooms = [`transfer:${transfer.id}`];
  if (transfer.userId) rooms.push(`user:${transfer.userId}`);
  return rooms;
}

// The realtime pipeline mirrors the UI's "verify -> process -> payout" journey.
const STEPS = [
  { key: 'authenticating', label: 'Authenticating credit card', delayMs: 900 },
  { key: 'routing', label: 'Securing 0.85% settlement route', delayMs: 1200 },
  { key: 'payout', label: 'Initiating bank payout transfer', delayMs: 1400 },
];

const TOTAL_STEPS = STEPS.length;

function statusPayload(transfer, extra = {}) {
  return {
    transferId: transfer.id,
    referenceId: transfer.referenceId,
    status: transfer.status,
    step: transfer.step,
    totalSteps: TOTAL_STEPS,
    ...extra,
  };
}

/**
 * Drive a transfer through its status steps, emitting a Socket.io event at each
 * stage to the transfer's room (and the owner's user room, if any).
 *
 * This is a simulated settlement pipeline — no real funds move. It exists so the
 * frontend can render live progress. Swap the timed steps for real
 * payment-gateway / payout webhooks when integrating a licensed processor.
 */
function startTransferProcessing(transfer) {
  let index = 0;

  const runNext = () => {
    if (index >= STEPS.length) {
      finalize(transfer);
      return;
    }
    const stepDef = STEPS[index];
    const stepNumber = index + 1;

    setTimeout(async () => {
      const updated = await transfers().update(transfer.id, {
        status: 'processing',
        step: stepNumber,
        stepKey: stepDef.key,
      });
      const current = updated || transfer;

      const payload = statusPayload(current, { message: `${stepDef.label}…` });
      emitToRooms(roomsFor(current), 'transfer:status', payload);

      index += 1;
      runNext();
    }, stepDef.delayMs);
  };

  runNext();
}

async function finalize(transfer) {
  const updated = await transfers().update(transfer.id, {
    status: 'completed',
    step: TOTAL_STEPS,
    stepKey: 'completed',
    completedAt: new Date().toISOString(),
  });
  const current = updated || transfer;

  const payload = statusPayload(current, {
    status: 'completed',
    message: 'Transfer submitted for settlement.',
  });
  emitToRooms(roomsFor(current), 'transfer:completed', payload);
}

module.exports = { startTransferProcessing, STEPS, TOTAL_STEPS };
