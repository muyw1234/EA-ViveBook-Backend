import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:1337';

async function main() {
  const body = {
    query: 'Recomiéndame un libro de programación barato',
    limit: 5,
  };

  console.log('Consultando recomendaciones...');
  console.log(`POST ${API_URL}/recomendaciones`);
  console.log('Body:');
  console.log(JSON.stringify(body, null, 2));

  const response = await fetch(`${API_URL}/recomendaciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  console.log('\nResultado completo:');
  console.log(JSON.stringify(data, null, 2));

  if (!response.ok) {
    process.exitCode = 1;
    return;
  }

  if (data?.data?.respuesta) {
    console.log('\nRespuesta de la IA:');
    console.log(data.data.respuesta);
  }

  if (Array.isArray(data?.data?.context)) {
    console.log('\nContexto usado:');
    console.log(JSON.stringify(data.data.context, null, 2));
  }
}

main().catch((error) => {
  console.error('Error ejecutando la consulta de recomendación:');
  console.error(error);
  process.exitCode = 1;
});
