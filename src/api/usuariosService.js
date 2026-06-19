// ================================================================
// usuariosService.js — Servicio de usuarios (cambio de contraseña)
// ================================================================

import axiosInstance from './axiosInstance';
import { getStoredUser } from '../utils/session';

/**
 * Cambia la contraseña del usuario autenticado.
 * PATCH /usuarios/:id/password
 *
 * @param {string} passwordActual - Contraseña anterior
 * @param {string} password       - Nueva contraseña
 * @returns {Promise<{status: boolean, msg?: string, error?: string}>}
 */
export const cambiarPassword = async (passwordActual, password) => {
  const user = getStoredUser();
  if (!user?.user_id) {
    throw new Error('Usuario no identificado');
  }

  const payload = {
    passwordActual,
    password,
  };

  const response = await axiosInstance.patch(
    `/usuarios/${user.user_id}/password`,
    payload
  );

  return response.data;
};
