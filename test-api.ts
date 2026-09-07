import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  // Dynamically import the GET function
  const { GET } = await import('./src/app/api/purchasing/goods-receive/[id]/route');
  
  const req = new Request('http://localhost:3000/api/purchasing/goods-receive/cmtr5qdcg0005cguv9sm9occd');
  const res = await GET(req as any, { params: { id: 'cmtr5qdcg0005cguv9sm9occd' } });
  
  const json = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', json);
}

run().catch(console.error);
