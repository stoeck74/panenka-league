"use server"

import { signIn, signOut } from "@/../auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    redirect("/login?error=missing")
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=invalid")
    }
    throw error
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" })
}