import crypto from 'crypto';
import { ILibro } from '../models/Libro';
import axios from 'axios';
import Logging from '../library/Logging';
import { IAutor } from '../models/Autor';

const algorithm = 'md5'; // lo mejor seria ponerlo en .env

export type OpenLibraryBookMetadata = {
  isbn: string;
  title: string;
  authors: string[];
  imageUrl: string;
};

function formatUrlGoogle(isbn: string): string {
  return `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&country=US`;
}

function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[-\s]/g, '');
}

function formatUrlOpenLibraryBook(isbn: string): string {
  return `https://openlibrary.org/isbn/${normalizeIsbn(isbn)}.json`;
}

function formatUrlOpenLibrarySearchByIsbn(isbn: string): string {
  return `https://openlibrary.org/search.json?isbn=${normalizeIsbn(isbn)}`;
}

function formatUrlOpenLibraryAutor(olid: string): string {
  return `https://openlibrary.org/${olid.replace(/^\/+/, '')}.json`;
}

function formatUrlOpenLibraryCover(isbn: string): string {
  return `https://covers.openlibrary.org/b/isbn/${normalizeIsbn(isbn)}-L.jpg`;
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

async function callOpenLibrarySearchAuthorsByIsbn(isbn: string): Promise<string[]> {
  const headers = { accept: 'application/json' };

  return await axios
    .get(formatUrlOpenLibrarySearchByIsbn(isbn), { headers })
    .then((response) => {
      const firstDoc = Array.isArray(response.data?.docs) ? response.data.docs[0] : null;
      const authors = Array.isArray(firstDoc?.author_name) ? firstDoc.author_name : [];

      return authors.filter((author: unknown): author is string => typeof author === 'string');
    })
    .catch((error) => {
      Logging.error(
        `Couldn't retrieve author fallback from ${formatUrlOpenLibrarySearchByIsbn(isbn)}\nError: ${error}`,
      );
      return [];
    });
}

export async function callOpenLibraryBookMetadataApi(
  isbn: string,
): Promise<OpenLibraryBookMetadata> {
  const headers = { accept: 'application/json' };
  const normalizedIsbn = normalizeIsbn(isbn);

  return await axios
    .get(formatUrlOpenLibraryBook(isbn), { headers: headers })
    .then(async (response) => {
      const buffer = response.data;
      const title = buffer.title;

      if (!title) {
        throw new Error(`OpenLibrary no devolvio titulo para el ISBN ${normalizedIsbn}`);
      }

      const referencedAuthors = Array.isArray(buffer.authors) ? buffer.authors : [];
      const authors = await Promise.all(
        referencedAuthors.map(async (item: { key?: string }) => {
          if (!item.key) return '';

          try {
            return (await callOpenLibraryAuthorApi(item.key))?.fullName || '';
          } catch (error) {
            Logging.error(`Couldn't retrieve author ${item.key} from OpenLibrary`);
            return '';
          }
        }),
      );

      const authorNames = authors.filter((author) => Boolean(author));
      const fallbackAuthors =
        authorNames.length > 0
          ? authorNames
          : await callOpenLibrarySearchAuthorsByIsbn(normalizedIsbn);

      const metadata: OpenLibraryBookMetadata = {
        title,
        isbn: normalizedIsbn,
        authors: fallbackAuthors,
        imageUrl: formatUrlOpenLibraryCover(normalizedIsbn),
      };

      return metadata;
    })
    .catch((error) => {
      Logging.error(
        `Couldn't retrieve data from ${formatUrlOpenLibraryBook(isbn)}\nError: ${error}`,
      );
      throw error;
    });
}

export async function callOpenLibraryBookApi(isbn: string): Promise<ILibro> {
  const metadata = await callOpenLibraryBookMetadataApi(isbn);

  return {
    title: metadata.title,
    isbn: metadata.isbn,
    authors: metadata.authors,
    imageUrl: metadata.imageUrl,
    IsDeleted: false,
    type: 'VENTA',
    precio: 0,
    estado: 'Nuevo',
  };
}
