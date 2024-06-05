const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(require('cors')());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error('Chave da API do OpenAI não encontrada. Certifique-se de que o arquivo .env está configurado corretamente.');
    process.exit(1);
}

app.post('/translate', async (req, res) => {
    const { text, sourceLang, targetLang } = req.body;

    console.log('Recebido texto para tradução:', text);
    console.log('Idioma de origem:', sourceLang);
    console.log('Idioma de destino:', targetLang);

    const prompt = `Traduza o seguinte texto de ${sourceLang} para ${targetLang}:\n\n${text}\n\nTexto traduzido:`;

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'Você é um tradutor útil.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 500,
            temperature: 0.3
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Resposta da API:', response.data);
        const translatedText = response.data.choices[0].message.content.trim();
        res.json({ translatedText });
    } catch (error) {
        console.error('Erro ao traduzir o texto:', error.response ? error.response.data : error.message);
        res.status(500).send('Erro ao traduzir o texto');
    }
});

app.post('/chat', async (req, res) => {
    const { message, sourceLang, targetLang } = req.body;

    const correctionPrompt = `Corrija a ortografia e gramática da seguinte frase em ${sourceLang}: "${message}".`;
    const responsePrompt = `Responda a seguinte pergunta de forma informativa e clara em ${sourceLang}:`;
    const translationPrompt = `Traduza a seguinte frase para ${targetLang}:`;

    try {
        // Corrigir ortografia e gramática
        const correctionResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'Você é um corretor de ortografia e gramática.' },
                { role: 'user', content: correctionPrompt }
            ],
            max_tokens: 500,
            temperature: 0.3
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const correctedMessage = correctionResponse.data.choices[0].message.content.trim();

        // Gerar resposta para a mensagem corrigida
        const responseToCorrectedMessage = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'Você é um assistente útil.' },
                { role: 'user', content: `${responsePrompt} ${correctedMessage}` }
            ],
            max_tokens: 500,
            temperature: 0.3
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const generatedResponse = responseToCorrectedMessage.data.choices[0].message.content.trim();

        // Traduzir a resposta gerada para a língua de destino
        const translationResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'Você é um tradutor.' },
                { role: 'user', content: `${translationPrompt} ${generatedResponse}` }
            ],
            max_tokens: 500,
            temperature: 0.3
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const translatedResponse = translationResponse.data.choices[0].message.content.trim();

        res.json({ correctedMessage, response: translatedResponse });
    } catch (error) {
        console.error('Erro ao processar a mensagem:', error.response ? error.response.data : error.message);
        res.status(500).send('Erro ao processar a mensagem');
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
