import crypto from 'crypto';
import { ILibro } from '../models/Libro';
import axios from 'axios';
import Logging from '../library/Logging';

const algorithm = 'md5'; // lo mejor seria ponerlo en .env

function formatUrl(isbn: string): string {
    return `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&country=US`;
}

export function hash(text: string) {
    return crypto.createHash(algorithm).update(text).digest('hex');
}

export async function callGoogleApi(isbn: string): Promise<ILibro> {
    //return {}; // aun no esta implementado
    return await axios
        .get(formatUrl(isbn))
        .then((response) => {
            let buffer = response.data.items[0].volumeInfo;
            const res: ILibro = {
                title: buffer.title,
                isbn: buffer.industryIdentifiers[1].identifier,
                authors: buffer.authors as string[],
                IsDeleted: false
            };
            return res;
        })
        .catch((error) => {
            Logging.error(`Couldn't retrieve data from ${formatUrl(isbn)}`);
            throw error;
        });
}
