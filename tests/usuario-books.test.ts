import { describe, expect, it } from 'vitest';
import Usuario from '../src/models/Usuario';
import { createTestApp } from './helpers/appFactory';
import { getProfileLibros } from './helpers/authFactory';
import { buyLibro, createLibro } from './helpers/libroFactory';
import { createTestUser } from './helpers/userFactory';
import {
  checkFavorito,
  listFavoritos,
  toggleFavoriteBooks,
  toggleFavoritos,
  toggleWishlist,
} from './helpers/usuarioFactory';

describe('Usuarios book collections API', () => {
  const app = createTestApp();

  it('permite agregar y quitar libros de la wishlist', async () => {
    const { user, token } = await createTestUser({
      email: 'wishlist-user@test.com',
    });
    const { token: ownerToken } = await createTestUser({
      email: 'wishlist-owner@test.com',
    });
    const bookResponse = await createLibro(app, ownerToken, {
      title: 'Libro wishlist',
    });
    const libroId = bookResponse.body.data._id;

    const addResponse = await toggleWishlist(app, libroId, token);

    expect(addResponse.status).toBe(200);
    expect(addResponse.body).toMatchObject({
      success: true,
      status: 200,
      data: {
        _id: user._id.toString(),
      },
    });

    const userWithWishlist = await Usuario.findById(user._id);
    expect(userWithWishlist?.wishlist?.map((id) => id.toString())).toContain(libroId);

    const removeResponse = await toggleWishlist(app, libroId, token);

    expect(removeResponse.status).toBe(200);
    const userWithoutWishlist = await Usuario.findById(user._id);
    expect(userWithoutWishlist?.wishlist?.map((id) => id.toString())).not.toContain(libroId);
  });

  it('permite agregar y quitar libros de favoriteBooks', async () => {
    const { user, token } = await createTestUser({
      email: 'favorite-books-user@test.com',
    });
    const { token: ownerToken } = await createTestUser({
      email: 'favorite-books-owner@test.com',
    });
    const bookResponse = await createLibro(app, ownerToken, {
      title: 'Libro favoriteBooks',
    });
    const libroId = bookResponse.body.data._id;

    const addResponse = await toggleFavoriteBooks(app, libroId, token);

    expect(addResponse.status).toBe(200);
    expect(addResponse.body).toMatchObject({
      success: true,
      status: 200,
    });

    const userWithFavoriteBook = await Usuario.findById(user._id);
    expect(userWithFavoriteBook?.favoriteBooks?.map((id) => id.toString())).toContain(libroId);

    const removeResponse = await toggleFavoriteBooks(app, libroId, token);

    expect(removeResponse.status).toBe(200);
    const userWithoutFavoriteBook = await Usuario.findById(user._id);
    expect(userWithoutFavoriteBook?.favoriteBooks?.map((id) => id.toString())).not.toContain(
      libroId,
    );
  });

  it('permite gestionar favoritos legacy y comprobar su estado', async () => {
    const { token } = await createTestUser({
      email: 'favoritos-user@test.com',
    });
    const { token: ownerToken } = await createTestUser({
      email: 'favoritos-owner@test.com',
    });
    const bookResponse = await createLibro(app, ownerToken, {
      title: 'Libro favorito legacy',
    });
    const libroId = bookResponse.body.data._id;

    const initialCheckResponse = await checkFavorito(app, libroId, token);

    expect(initialCheckResponse.status).toBe(200);
    expect(initialCheckResponse.body.data).toEqual({ isFavorite: false });

    const addResponse = await toggleFavoritos(app, libroId, token);

    expect(addResponse.status).toBe(200);
    expect(addResponse.body.data.map((id: string) => id.toString())).toContain(libroId);

    const listResponse = await listFavoritos(app, token);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _id: libroId,
          title: 'Libro favorito legacy',
        }),
      ]),
    );

    const afterAddCheckResponse = await checkFavorito(app, libroId, token);

    expect(afterAddCheckResponse.status).toBe(200);
    expect(afterAddCheckResponse.body.data).toEqual({ isFavorite: true });

    const removeResponse = await toggleFavoritos(app, libroId, token);

    expect(removeResponse.status).toBe(200);
    expect(removeResponse.body.data.map((id: string) => id.toString())).not.toContain(libroId);
  });

  it('requiere token para wishlist y favoritos', async () => {
    const { token: ownerToken } = await createTestUser();
    const bookResponse = await createLibro(app, ownerToken, {
      title: 'Libro protegido usuarios',
    });
    const libroId = bookResponse.body.data._id;

    const wishlistResponse = await toggleWishlist(app, libroId);
    const favoriteBooksResponse = await toggleFavoriteBooks(app, libroId);
    const favoritosResponse = await toggleFavoritos(app, libroId);
    const listFavoritosResponse = await listFavoritos(app);

    for (const response of [
      wishlistResponse,
      favoriteBooksResponse,
      favoritosResponse,
      listFavoritosResponse,
    ]) {
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        status: 401,
        code: 'UNAUTHORIZED',
      });
    }
  });

  it('devuelve profile/libros por categoria y aplica paginacion', async () => {
    const { token: ownerToken } = await createTestUser({
      email: 'profile-owner@test.com',
    });
    const { token: viewerToken } = await createTestUser({
      email: 'profile-viewer@test.com',
    });

    await createLibro(app, ownerToken, {
      title: 'Libro subido A',
    });
    await createLibro(app, ownerToken, {
      title: 'Libro subido B',
    });
    const wishlistBookResponse = await createLibro(app, ownerToken, {
      title: 'Libro en wishlist',
    });
    const boughtBookResponse = await createLibro(app, ownerToken, {
      title: 'Libro comprado perfil',
    });

    await toggleWishlist(app, wishlistBookResponse.body.data._id, ownerToken);
    await buyLibro(app, boughtBookResponse.body.data._id, viewerToken);

    const uploadedResponse = await getProfileLibros(app, ownerToken, {
      category: 'uploaded',
      page: 1,
      limit: 1,
    });

    expect(uploadedResponse.status).toBe(200);
    expect(uploadedResponse.body.data).toMatchObject({
      page: 1,
      limit: 1,
      total: 4,
      totalPages: 4,
      counts: {
        uploaded: 4,
        wishlist: 1,
      },
    });
    expect(uploadedResponse.body.data.libros).toHaveLength(1);

    const wishlistResponse = await getProfileLibros(app, ownerToken, {
      category: 'wishlist',
    });

    expect(wishlistResponse.status).toBe(200);
    expect(wishlistResponse.body.data.libros).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _id: wishlistBookResponse.body.data._id,
          title: 'Libro en wishlist',
        }),
      ]),
    );

    const boughtResponse = await getProfileLibros(app, viewerToken, {
      category: 'bought',
    });

    expect(boughtResponse.status).toBe(200);
    expect(boughtResponse.body.data.libros).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _id: boughtBookResponse.body.data._id,
          title: 'Libro comprado perfil',
        }),
      ]),
    );
  });

  it('rechaza profile/libros sin token o con categoria invalida', async () => {
    const { token } = await createTestUser({
      email: 'profile-invalid-category@test.com',
    });

    const unauthorizedResponse = await getProfileLibros(app);

    expect(unauthorizedResponse.status).toBe(401);
    expect(unauthorizedResponse.body).toMatchObject({
      success: false,
      status: 401,
      code: 'UNAUTHORIZED',
    });

    const invalidCategoryResponse = await getProfileLibros(app, token, {
      category: 'categoria-rara',
    });

    expect(invalidCategoryResponse.status).toBe(400);
    expect(invalidCategoryResponse.body).toEqual({ message: 'Categoría inválida' });
  });
});
