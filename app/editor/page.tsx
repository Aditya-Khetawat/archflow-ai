import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getProjectsForUser } from "@/lib/projects"
import { EditorHomeClient } from "@/components/editor/editor-home-client"

export default async function EditorPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? ""

  const { owned, shared } = await getProjectsForUser(userId, email)

  return (
    <EditorHomeClient
      ownedProjects={owned.map((p) => ({ id: p.id, name: p.name }))}
      sharedProjects={shared.map((p) => ({ id: p.id, name: p.name }))}
    />
  )
}
