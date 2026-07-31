import { currentUser } from "@clerk/nextjs/server";
import { getLiveblocks, getUserColor } from "@/lib/liveblocks";
import {
  getCurrentProjectIdentity,
  userHasProjectAccess,
} from "@/lib/project-access";

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity();

  if (!identity.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { room } = await request.json();

  if (!room || typeof room !== "string") {
    return new Response("Bad Request", { status: 400 });
  }

  const hasAccess = await userHasProjectAccess(room, identity);

  if (!hasAccess) {
    return new Response("Forbidden", { status: 403 });
  }

  const lb = getLiveblocks();

  // Ensure the room exists and grant this user write access.
  // Using usersAccesses so the room remains private by default but
  // each authenticated project member gets full write access.
  await lb.getOrCreateRoom(room, {
    defaultAccesses: [],
    usersAccesses: {
      [identity.userId]: ["room:write"],
    },
  });

  const user = await currentUser();
  const name =
    user?.fullName ??
    user?.primaryEmailAddress?.emailAddress ??
    "Anonymous";
  const avatar = user?.imageUrl ?? "";
  const color = getUserColor(identity.userId);

  // Use identifyUser (ID token) instead of prepareSession (access token).
  // ID tokens are valid for ALL Liveblocks APIs including Feeds, Comments,
  // Notifications — not just the specific room.
  const { status, body } = await lb.identifyUser(
    { userId: identity.userId, groupIds: [] },
    { userInfo: { name, avatar, color } }
  );

  return new Response(body, { status });
}
