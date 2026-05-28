import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
    get,
    getDatabase,
    onValue,
    ref,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBk7mgMUTUwqRe2bSVDtvbJZ80g6_kP3ug",
  authDomain: "filasemfila.firebaseapp.com",
  databaseURL: "https://filasemfila-default-rtdb.firebaseio.com",
  projectId: "filasemfila",
  storageBucket: "filasemfila.firebasestorage.app",
  messagingSenderId: "189346378434",
  appId: "1:189346378434:web:b977d0aa13e5655ba8015b",
  measurementId: "G-R7VBN74EXX"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const displaySenhaAtual = document.getElementById("senha-atual");
const mensagemStatus = document.getElementById("mensagem-status");
const displayFaltam = document.getElementById("contador-faltam");
const inputSenha = document.getElementById("input-minha-senha");
const feedback = document.getElementById("feedback-usuario");
const senhaAtualRef = ref(database, "senha_atual");

const senhaSalva = localStorage.getItem("minha_senha");

if (senhaSalva && inputSenha && feedback) {
    inputSenha.value = senhaSalva;
    feedback.classList.remove("hidden");
}

onValue(senhaAtualRef, (snapshot) => {
    const senhaChamando = snapshot.val();
    displaySenhaAtual.textContent = formatarSenha(senhaChamando);
    atualizarCalculo(senhaChamando);
}, (error) => {
    console.error("Erro ao acompanhar a fila:", error);
    alert("Não foi possível acompanhar a fila agora. Verifique a conexão e as regras do Firebase.");
});

window.gerarNovaSenha = function gerarNovaSenha() {
    const refUltima = ref(database, "ultima_senha_gerada");

    runTransaction(refUltima, (valorAtual) => {
        const senhaAtual = Number(valorAtual) || 0;
        return senhaAtual >= 999 ? 1 : senhaAtual + 1;
    }).then((result) => {
        if (!result.committed) return;

        const novaSenha = result.snapshot.val();
        processarNovaSenha(novaSenha);
        alert(`Sua senha gerada é: ${novaSenha}`);
    }).catch((error) => {
        console.error("Erro ao gerar senha:", error);
        alert("Não foi possível gerar uma nova senha.");
    });
};

window.salvarMinhaSenha = function salvarMinhaSenha() {
    const minhaSenha = Number.parseInt(inputSenha.value, 10);

    if (Number.isNaN(minhaSenha) || minhaSenha <= 0 || minhaSenha > 999) {
        alert("Digite uma senha válida entre 1 e 999!");
        return;
    }

    processarNovaSenha(minhaSenha);
};

function processarNovaSenha(numero) {
    localStorage.setItem("minha_senha", String(numero));
    inputSenha.value = numero;
    feedback.classList.remove("hidden");

    get(senhaAtualRef)
        .then((snapshot) => atualizarCalculo(snapshot.val()))
        .catch((error) => {
            console.error("Erro ao atualizar cálculo da fila:", error);
            alert("Senha salva, mas não foi possível calcular a posição na fila.");
        });
}

function atualizarCalculo(senhaChamando) {
    const minhaSenha = localStorage.getItem("minha_senha");

    if (!minhaSenha || senhaChamando === null || senhaChamando === undefined) {
        return;
    }

    const atual = Number.parseInt(senhaChamando, 10);
    const minha = Number.parseInt(minhaSenha, 10);

    if (Number.isNaN(atual) || Number.isNaN(minha)) {
        mensagemStatus.textContent = "Erro ao calcular posição.";
        displayFaltam.textContent = "";
        return;
    }

    const diferenca = minha - atual;

    // Ainda vai chegar
    if (diferenca > 0) {
        mensagemStatus.textContent = "Sua vez está chegando!";
        displayFaltam.textContent = `Faltam ${diferenca} pessoas`;
        return;
    }

    // Chegou a vez
    if (diferenca === 0) {
        mensagemStatus.textContent = "É A SUA VEZ!";
        displayFaltam.textContent = "Vá ao balcão.";

        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }

        return;
    }

    // Já passou
    mensagemStatus.textContent = "Sua senha já passou.";
    displayFaltam.textContent = "";
}

function formatarSenha(senha) {
    if (senha === null || senha === undefined || senha === "") {
        return "00";
    }

    return String(senha).padStart(2, "0");
}
