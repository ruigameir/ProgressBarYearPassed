const FB = require('fb');
const fs = require('fs'); // Para lidar com o arquivo de imagem

require('dotenv').config();

const PAGE_ID = process.env.PAGE_ID;
const ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN; // Carregar ACCESS_TOKEN do arquivo .env
FB.setAccessToken(ACCESS_TOKEN);

const {
  createCanvas
} = require('canvas');

function generateProgressBarImage(percentage, year) {
  const width = 500; // Largura da imagem
  const height = 200; // Altura da imagem para dar espaço para o título
  const progressBarWidth = (percentage / 100) * width; // Tamanho proporcional à porcentagem

  // Criar o canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fundo branco
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Título (Progresso)
  ctx.fillStyle = '#333';  // Cor escura para o título
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(percentage + '% de ' + year + ' já passou', width / 2, 40); // Coloca o título um pouco acima da barra

  // Barra de progresso (sem porcentagem escrita na barra)
  ctx.fillStyle = '#04AA6D'; // Cor verde para a barra
  ctx.fillRect(50, 100, progressBarWidth, 30); // Barra de progresso centralizada

  // Borda preta ao redor da barra
  ctx.strokeStyle = '#000000'; // Cor preta para a borda
  ctx.lineWidth = 2; // Espessura da borda
  ctx.strokeRect(50, 100, width - 100, 30); // Desenha a borda ao redor do espaço total da barra

  // Salvar a imagem em um arquivo
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('progress-bar.png', buffer);

  console.log('Progress bar image saved as progress-bar.png');
}

// Caminho para a imagem e legenda
const imagePath = 'progress-bar.png';
const caption = '';

function uploadPhotoAndPost() {
  // Fazer o upload da imagem para o Facebook
  FB.api(
    PAGE_ID + '/photos', // Endpoint para upload de imagem
    'POST',
    {
      caption: caption, // Legenda para a imagem
      source: fs.createReadStream(imagePath), // Caminho da imagem no sistema
      access_token: ACCESS_TOKEN, // Token de acesso com permissões adequadas
    },
    function (uploadResponse) {
      if (uploadResponse.error) {
        console.log('Erro ao fazer upload da foto: ' + uploadResponse.error.message);
        return;
      }

      const photoId = uploadResponse.id; // ID da foto retornada
      console.log('Imagem carregada com sucesso com ID:', photoId);

      // Agora cria um post no feed com a imagem
       FB.api(
        PAGE_ID + '/feed', // Endpoint para o feed da página
        'POST',
        {
          message: 'olá', // Texto do post
          //object_attachment: photoId, // Anexa a imagem ao post usando o ID retornado
          access_token: ACCESS_TOKEN,  // Token de acesso para postar no feed
        },
        function (feedResponse) {
          if (feedResponse.error) {
            console.log('Erro ao postar no feed:', feedResponse.error.message);
            return;
          }
          console.log('Postagem realizada com sucesso no feed! ID do post:', feedResponse.id);
        }
      );
    }
  );
}

function leapyear(year) {
  // Return true if the year is divisible by 4 but not divisible by 100 unless it's also divisible by 400
  return (year % 100 === 0) ? (year % 400 === 0) : (year % 4 === 0);
}

function getYearPercentage() {
  let now = new Date(); // Data e hora atuais
  let year = now.getFullYear(); // Obter o ano atual
  let startOfYear = new Date(year, 0, 1); // Definir o início do ano
  let hoursPassed = (now - startOfYear) / (1000 * 60 * 60); // Calcular as horas passadas desde o início do ano
  const yearHours = leapyear(year) ? 8784 : 8760;

  return (hoursPassed / yearHours) * 100;
}

// Variável para armazenar o valor anterior da porcentagem
let lastPercentage = getYearPercentage().toFixed(5);
console.log('Initial percentage:', lastPercentage);

var percentageNumber = Math.floor(lastPercentage);

// Agendar uma tarefa com o node-schedule
const schedule = require('node-schedule');

const job = schedule.scheduleJob('* * * * *', function () {
  const currentPercentage = getYearPercentage().toFixed(5);

  //if (Math.floor(currentPercentage) > Math.floor(lastPercentage)) {
  if (currentPercentage > lastPercentage) {
    generateProgressBarImage(currentPercentage, 2025);
    uploadPhotoAndPost(); // Chama a função para postar a imagem
    console.log('Percentage changed, posted image. New percentage:', currentPercentage);
  } else {
    console.log('Percentage not changed. New percentage:', currentPercentage);
  }

  // Atualizar o valor da percentagem anterior
  lastPercentage = currentPercentage;
});