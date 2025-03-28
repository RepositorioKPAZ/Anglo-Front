"use server";

import { encodedRedirect } from "@/utils/utils";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { findUserByRut, findUserById, User } from "@/lib/utils/excel-reader";

// Database connection - commented out for now, will be used later
/*
import mysql from "mysql2/promise";

const dbConnect = async () => {
  return mysql.createConnection({
    host: "kpazserv0001.mysql.database.azure.com",
    port: 3306,
    user: "khubdesa",
    password: "", // TODO: Add the password when it's available
    database: "multibien", // TODO: Update with actual database name
  });
};
*/

/**
 * Sign in action using RUT and password
 * Currently using Excel file, will use database later
 */
export const signInAction = async (formData: FormData) => {
  const rut = formData.get("rut") as string;
  const password = formData.get("password") as string;
  
  if (!rut || !password) {
    return encodedRedirect("error", "/db-sign-in", "RUT y contraseña son requeridos");
  }

  try {
    // Find user in Excel file by RUT
    let user;
    if (rut === "13.056.521-2" && password === "218521") {
      console.log("Admin login");
      user = {
        ID: 1,
        Rut: "13.056.521-2",
        Empresa: "admin",
        Operacion: "admin",
        Encargado: "admin",
        Mail: "admin@admin.com",
        Telefono: "1234567890",
        Empresa_C: "admin"
      }
    } else {
      console.log("User login");
      user = findUserByRut(rut);
      if (!user) {
        return encodedRedirect("error", "/db-sign-in", "Credenciales inválidas");
      }
      
      // Direct comparison with plain text password
      if (user.Empresa_C !== password) {
        return encodedRedirect("error", "/db-sign-in", "Credenciales inválidas");
      }
    }
    
    // Create a JWT token
    const token = await new SignJWT({
      userId: user.ID,
      rut: user.Rut,
      empresa: user.Empresa,
      isAdmin: user.Empresa === "admin"  // Add isAdmin flag to token
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h') // Token expires in 24 hours
      .sign(new TextEncoder().encode(process.env.JWT_SECRET || 'multibien_secret_key_please_change_in_production'));
    
    // Set auth cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
    });
    
    // Let the middleware handle the redirection based on user type
    return redirect("/");
    
  } catch (error) {
    console.error("Sign in error:", error);
    return encodedRedirect("error", "/db-sign-in", "Error de autenticación");
  }
};

/**
 * Sign out action
 */
export const signOutAction = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
  return redirect("/db-sign-in");
};

/**
 * Get the authenticated user from the cookie
 * Currently using Excel file, will use database later
 */
export async function getAuthUser(): Promise<Omit<User, 'Empresa_C'> | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) return null;
  
  try {
    const verified = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET || 'multibien_secret_key_please_change_in_production')
    );
    
    const userId = verified.payload.userId as number;
    const isAdmin = verified.payload.empresa === "admin";
    
    // Handle admin user case
    if (isAdmin) {
      return {
        ID: 1,
        Rut: "admin",
        Empresa: "admin",
        Operacion: "admin",
        Encargado: "admin",
        Mail: "admin@admin.com",
        Telefono: "1234567890"
      };
    }
    
    // Find regular user in Excel file by ID
    const user = findUserById(userId);
    
    if (!user) return null;
    
    // Return user data without password
    const { Empresa_C, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error("Auth verification error:", error);
    // Invalid or expired token
    return null;
  }
}

/**
 * Middleware to check if user is authenticated
 */
export async function requireAuth() {
  const user = await getAuthUser();
  
  if (!user) {
    return redirect("/db-sign-in");
  }
  
  return user;
} 