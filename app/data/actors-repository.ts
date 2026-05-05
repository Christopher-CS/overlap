import mockCalendarDataJson from "./mock-calendar-events.json";
import type { ActorRecord, ActorsRepository } from "./actors-types";
import { toActorId } from "./ids";

type RawMockActor = Omit<ActorRecord, "id"> & { id: string };

type MockCalendarData = {
  actors: RawMockActor[];
};

const seedActors: ActorRecord[] = (mockCalendarDataJson as MockCalendarData).actors.map((actor) => ({
  ...actor,
  id: toActorId(actor.id),
}));

const createLocalActorsRepository = (): ActorsRepository => ({
  async listActors() {
    return [...seedActors];
  },
});

export const localActorsRepository: ActorsRepository = createLocalActorsRepository();
