import { toGroupId, toUserId } from "../ids";
import type { RepositoryBundle } from "../repository-provider";

/**
 * Behavioral contract every {@link RepositoryBundle} implementation
 * must satisfy. Both the local mock bundle and the future Supabase
 * bundle should pass this suite.
 *
 * The factory is invoked once at the start of the suite; tests are
 * additive and never assume an empty starting state, so they can run
 * against shared / persistent backends.
 */
export const runRepositoryContract = (
  label: string,
  factory: () => RepositoryBundle,
) => {
  describe(`RepositoryBundle contract — ${label}`, () => {
    let repositories: RepositoryBundle;

    beforeAll(() => {
      repositories = factory();
    });

    describe("auth", () => {
      it("returns a session object from getSession()", async () => {
        const session = await repositories.auth.getSession();
        expect(session).toBeDefined();
        expect(["loading", "authenticated", "unauthenticated"]).toContain(session.status);
      });

      it("notifies subscribers via onSessionChange()", () => {
        let received = 0;
        const subscription = repositories.auth.onSessionChange(() => {
          received += 1;
        });
        expect(received).toBeGreaterThanOrEqual(1);
        subscription.unsubscribe();
      });
    });

    describe("profiles", () => {
      it("upsertProfile() returns the saved record", async () => {
        const id = toUserId(`contract-profile-${Date.now()}`);
        const saved = await repositories.profiles.upsertProfile({
          id,
          displayName: "Contract Tester",
          accentColor: "#123456",
        });
        expect(saved.id).toBe(id);
        expect(saved.displayName).toBe("Contract Tester");
        expect(saved.accentColor).toBe("#123456");
      });

      it("getProfile() returns null for unknown ids", async () => {
        const result = await repositories.profiles.getProfile(
          toUserId(`does-not-exist-${Date.now()}`),
        );
        expect(result).toBeNull();
      });
    });

    describe("actors", () => {
      it("listActors() returns at least one actor", async () => {
        const actors = await repositories.actors.listActors();
        expect(Array.isArray(actors)).toBe(true);
        expect(actors.length).toBeGreaterThan(0);
        for (const actor of actors) {
          expect(typeof actor.id).toBe("string");
          expect(["user", "group"]).toContain(actor.entityType);
        }
      });
    });

    describe("groups", () => {
      it("addGroup() then listGroups() includes the new group", async () => {
        const name = `Contract Group ${Date.now()}`;
        const created = await repositories.groups.addGroup({ name });
        const all = await repositories.groups.listGroups();
        expect(all.find((group) => group.id === created.id)).toBeDefined();
      });

      it("removeGroup() hides the group from listGroups()", async () => {
        const created = await repositories.groups.addGroup({
          name: `Removable ${Date.now()}`,
        });
        await repositories.groups.removeGroup(created.id);
        const all = await repositories.groups.listGroups();
        expect(all.find((group) => group.id === created.id)).toBeUndefined();
      });
    });

    describe("events", () => {
      it("createEvent() then listEvents() includes the new event", async () => {
        const sampleActor = (await repositories.actors.listActors())[0];
        expect(sampleActor).toBeDefined();
        const created = await repositories.events.createEvent({
          title: `Contract Event ${Date.now()}`,
          ownerId: sampleActor.id,
          date: "2026-04-22",
          startTime: "12:00",
          endTime: "13:00",
        });
        const all = await repositories.events.listEvents();
        expect(all.find((event) => event.id === created.id)).toBeDefined();
      });
    });

    describe("chat", () => {
      it("sendMessage() then listMessages() includes the new message", async () => {
        const groupId = toGroupId("contract-chat-group");
        const created = await repositories.chat.sendMessage({
          groupId,
          text: `Contract message ${Date.now()}`,
          senderId: toUserId("contract-sender"),
          senderName: "Contract Sender",
        });
        const all = await repositories.chat.listMessages(groupId);
        expect(all.find((message) => message.id === created.id)).toBeDefined();
      });
    });
  });
};
