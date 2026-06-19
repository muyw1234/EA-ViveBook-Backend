import crypto from 'crypto';
import { ILibro } from '../models/Libro';
import axios from 'axios';
import Logging from '../library/Logging';
import { IAutor } from '../models/Autor';

const algorithm = 'md5'; // lo mejor seria ponerlo en .env

function formatUrlGoogle(isbn: string): string {
  return `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&country=US`;
}
function formatUrlOpenLibraryBook(isbn: string): string {
  return `https://openlibrary.org/isbn/${isbn}`;
}

function formatUrlOpenLibraryAutor(olid: string): string {
  return `https://openlibrary.org/${olid}.json`;
}

export function hash(text: string) {
  return crypto.createHash(algorithm).update(text).digest('hex');
}

/**Unused */
export async function callGoogleApi(isbn: string): Promise<ILibro> {
  //return {}; // aun no esta implementado
  return await axios
    .get(formatUrlGoogle(isbn))
    .then((response) => {
      const buffer = response.data.items[0].volumeInfo;
      const res: ILibro = {
        title: buffer.title,
        isbn: buffer.industryIdentifiers[1].identifier,
        authors: buffer.authors as string[],
        IsDeleted: false,
        type: 'VENTA',
        precio: 0,
        estado: 'Nuevo',
      };
      return res;
    })
    .catch((error) => {
      Logging.error(`Couldn't retrieve data from ${formatUrlGoogle(isbn)}`);
      throw error;
    });
}

export async function callOpenLibraryAuthorApi(olid: string): Promise<IAutor> {
  const headers = { accept: 'application/json' };
  return await axios
    .get(formatUrlOpenLibraryAutor(olid), { headers: headers })
    .then((response) => {
      const buffer = response.data;

      const autor: IAutor = { fullName: buffer.name };
      return autor;
    })
    .catch((error) => {
      Logging.error(`Couldn't retrieve data from ${formatUrlOpenLibraryAutor(olid)}`);
      throw error;
    });
}

export async function callOpenLibraryBookApi(isbn: string): Promise<ILibro> {
  const headers = { accept: 'application/json' };
  return await axios
    .get(formatUrlOpenLibraryBook(isbn), { headers: headers })
    .then(async (response) => {
      const buffer = response.data;
      const title = buffer.title;
      const autores1 = buffer.authors; // estan referenciados como olids
      const autores2 = [] as string[]; // nombres
      for (const item of autores1) {
        autores2.push((await callOpenLibraryAuthorApi(item.key as string))?.fullName!);
      }
      const libro: ILibro = {
        title: title,
        isbn: isbn,
        authors: autores2,
        IsDeleted: false,
        type: 'VENTA',
        precio: 0,
        estado: 'Nuevo',
      };
      return libro;
    })
    .catch((error) => {
      Logging.error(
        `Couldn't retrieve data from ${formatUrlOpenLibraryBook(isbn)}\nError: ${error}`,
      );
      throw error;
    });
}
