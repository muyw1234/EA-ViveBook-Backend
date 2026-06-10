import fetch from 'node-fetch';

const API_URL = 'http://localhost:1337';

async function runTests() {
  console.log('--- Starting API Tests ---\n');

  try {
    // 1. Create a User
    console.log('1. Creating a user...');
    const userRes = await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test' + Date.now() + '@example.com',
        password: 'password123',
      }),
    });
    const user = await userRes.json();
    console.log('User created:', user);

    // 2. Create a Libreria
    console.log('\n2. Creating a libreria...');
    const libreriaRes = await fetch(`${API_URL}/librerias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Central Library',
        address: '123 Main St',
      }),
    });
    const libreria = await libreriaRes.json();
    console.log('Libreria created:', libreria);

    // 3. Create a Libro
    console.log('\n3. Creating a libro...');
    const libroRes = await fetch(`${API_URL}/libros`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Clean Code',
        author: 'Robert C. Martin',
        description: 'A Handbook of Agile Software Craftsmanship',
        price: 25,
        type: 'VENTA',
        owner: user._id,
        libreria: libreria._id,
      }),
    });
    const libro = await libroRes.json();
    console.log('Libro created:', libro);

    // 4. Create an Evento
    console.log('\n4. Creating an evento...');
    const eventoRes = await fetch(`${API_URL}/eventos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Book Reading',
        description: 'Reading session of Clean Code',
        date: new Date().toISOString(),
        libreria: libreria._id,
      }),
    });
    const evento = await eventoRes.json();
    console.log('Evento created:', evento);

    // 5. Create another User for chatting
    const userRes2 = await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Buyer User',
        email: 'buyer' + Date.now() + '@example.com',
        password: 'password123',
      }),
    });
    const user2 = await userRes2.json();

    // 6. Create a Chat
    console.log('\n5. Creating a chat...');
    const chatRes = await fetch(`${API_URL}/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participants: [user._id, user2._id],
        libro: libro._id,
      }),
    });
    const chat = await chatRes.json();
    console.log('Chat created:', chat);

    // 7. Send a Mensaje
    console.log('\n6. Sending a mensaje...');
    const mensajeRes = await fetch(`${API_URL}/mensajes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat: chat._id,
        sender: user2._id,
        content: 'I want to buy this book!',
      }),
    });
    const mensaje = await mensajeRes.json();
    console.log('Mensaje created:', mensaje);

    console.log('\n--- All tests passed! ---');
  } catch (error) {
    console.error('\n--- Test failed! ---');
    console.error(error);
  }
}

runTests();
