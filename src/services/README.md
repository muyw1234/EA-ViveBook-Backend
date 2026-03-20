# Documentacion

## Libro

- `createLibro(data: Partial<ILibro>) : Promise<ILibro|null>` Crea un libro a partir de los datos del libro y devuelve el libro recien creado.
- `getLibro(id: string) : Promise<ILibro|null>` : Obtiene el libro con ese id, si no lo encuentra entonces devuelve null.
- `getAllLibros() : Promise<ILibro[]|[]>` : Obtiene todos los libros.
- `updateLibro(id: string, data: ILibro) : Promise<ILibro|null>` Actualiza el libro con ese id y pasando los nuevos datos. Devuelve el libro actualizado.
- `getAllLibros_NOT_Deleted()` Obtiene todos los libros que no han sido soft deleted.
- `deleteLibro(id: string) : Promise<ILibro|null>` Elimina el libro especificado por ese id y devuelve el libro recien eliminado.
- `createLibroByIsbn(isbn: string) : Promise<ILibro|null>` Crea un libro basado en el isbn, los datos los obtenemos de la api de Google.
- `getLibroByIsbn(isbn : string)` : Busca el libro con esa ISBN.

## Autor:

- `getByName(fullName: string)` : Devuelve el modelo de autor con ese nombre.
- `createAutor(data: Partial<IAutor>)` : Crea y guarda el autor a partir de la instancia parcial de autor.
