import { prisma } from "../config/prisma.js";


export async function getEffectiveAvailability(profileId, date) {
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);

  const override = await prisma.availabilityOverride.findUnique({
    where: { profileId_date: { profileId, date: dayStart } },
  });

  if (override) {
    if (!override.isAvailable) return null;
    return { startTime: override.startTime, endTime: override.endTime, isOverride: true };
  }

  const dayOfWeek = dayStart.getUTCDay();
  const weeklyRule = await prisma.weeklyAvailability.findFirst({
    where: { profileId, day: dayOfWeek, enabled: true },
  });

  if (!weeklyRule) return null;
  return { startTime: weeklyRule.startTime, endTime: weeklyRule.endTime, isOverride: false };
}


export async function assertBookingAllowed({ profile, startDateTime, endDateTime }) {
  const now = new Date();

  // ── Préavis minimum ──
  const minNoticeMs = (profile.minNoticeHours ?? 0) * 60 * 60 * 1000;
  if (startDateTime.getTime() - now.getTime() < minNoticeMs) {
    throw new Error(
      `This expert requires at least ${profile.minNoticeHours} hours' notice for bookings.`,
    );
  }

  // ── Horizon de réservation ──
  if (profile.bookingHorizonDays != null) {
    const horizonMs = profile.bookingHorizonDays * 24 * 60 * 60 * 1000;
    if (startDateTime.getTime() - now.getTime() > horizonMs) {
      throw new Error(
        `This expert only accepts bookings up to ${profile.bookingHorizonDays} days in advance.`,
      );
    }
  }

  // ── Disponibilité effective (override > hebdo) ──
  const availability = await getEffectiveAvailability(profile.id, startDateTime);
  if (!availability) {
    throw new Error("Expert is not available on this date.");
  }

  const [startHour, startMinute] = availability.startTime.split(":").map(Number);
  const [endHour, endMinute] = availability.endTime.split(":").map(Number);

  const windowStartMins = startHour * 60 + startMinute;
  const windowEndMins = endHour * 60 + endMinute;

  const bookingStartMins = startDateTime.getUTCHours() * 60 + startDateTime.getUTCMinutes();
  const bookingEndMins = endDateTime.getUTCHours() * 60 + endDateTime.getUTCMinutes();

  if (bookingStartMins < windowStartMins || bookingEndMins > windowEndMins) {
    throw new Error("Requested time is outside the expert's available hours.");
  }
}