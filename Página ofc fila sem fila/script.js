// 1. OS IMPORTS SEMPRE NO TOPO (FORA DE QUALQUER FUNÇÃO)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction, get } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-database.js";

// 2. CONFIGURAÇÃO (Troque SUA_API_KEY_AQUI pela chave que está no site do Firebase)
const firebaseConfig = {
    apiKey: "AIzaSyBk7mgMUTUwqRe2bSVDtvbJZ80g6_kP3ug", 
    databaseURL: "https://filasemfila-default-rtdb.firebaseio.com",
    projectId: "filasemfila"
};

// 3. INICIALIZAÇÃO
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// 4. ELEMENTOS DO HTML
const displaySenhaAtual = document.getElementById('senha-atual');
const displayFaltam = document.getElementById('contador-faltam');
const inputSenha = document.getElementById('input-minha-senha');
const feedback = document.getElementById('feedback-usuario');

const senhaAtualRef = ref(database, 'senha_atual');

// --- ATUALIZAÇÃO EM TEMPO REAL ---
onValue(senhaAtualRef, (snapshot) => {
    const senhaChamando = snapshot.val();
    if (displaySenhaAtual) displaySenhaAtual.innerText = senhaChamando || "00";
    atualizarCalculo(senhaChamando);
});

// --- FUNÇÃO PARA GERAR SENHA ---
window.gerarNovaSenha = function() {
    const refUltima = ref(database, 'ultima_senha_gerada');

    runTransaction(refUltima, (valorAtual) => {
        if (valorAtual === null) return 1;
        return (valorAtual >= 999) ? 1 : valorAtual + 1;
    }).then((result) => {
        if (result.committed) {
            const novaSenha = result.snapshot.val();
            processarNovaSenha(novaSenha);
            alert("Sua senha gerada é: " + novaSenha);
        }
    });
};

// --- FUNÇÃO PARA SALVAR SENHA MANUAL ---
window.salvarMinhaSenha = function() {
    const minhaSenha = parseInt(inputSenha.value);

    if (isNaN(minhaSenha) || minhaSenha <= 0 || minhaSenha > 999) {
        alert("Digite uma senha válida entre 1 e 999!");
        return;
    }
    processarNovaSenha(minhaSenha);
};

// --- LÓGICA DE PROCESSAMENTO ---
function processarNovaSenha(num) {
    localStorage.setItem('minha_senha', num);
    if (inputSenha) inputSenha.value = num;
    if (feedback) feedback.classList.remove('hidden');

    // Busca a senha atual uma vez para atualizar o cálculo
    get(senhaAtualRef).then((snap) => {
        atualizarCalculo(snap.val());
    });
}

// --- CÁLCULO DA POSIÇÃO NA FILA ---
function atualizarCalculo(senhaChamando) {
    const minhaSenha = localStorage.getItem('minha_senha');
    if (!minhaSenha || !senhaChamando) return;

    const atual = parseInt(senhaChamando);
    const minha = parseInt(minhaSenha);
    const diferenca = minha - atual;

    if (!displayFaltam) return;

    if (diferenca > 0) {
        displayFaltam.innerText = `Faltam ${diferenca} pessoas`;
    } 
    else if (diferenca === 0) {
        displayFaltam.innerText = "É A SUA VEZ! Vá ao balcão.";
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } 
    else {
        displayFaltam.innerText = "Sua senha já passou.";
    }
}