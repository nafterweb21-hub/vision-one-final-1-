async function run() {
  const res = await fetch('http://localhost:3000/api/purchasing/goods-receive/cmtr5qdcg0005cguv9sm9occd');
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
}
run();
