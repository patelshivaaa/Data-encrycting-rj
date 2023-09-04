const socket = io("http://localhost:3000");

const dataList = document.getElementById('data-list');
const successRate = document.getElementById('success-rate');

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('dataSaved', (data) => {
  const listItem = document.createElement('li');
  listItem.textContent = JSON.stringify(data);
  dataList.appendChild(listItem);
});

socket.on('successRate', (rate) => {
  successRate.textContent = `Success Rate: ${rate.toFixed(2)}%`;
});
