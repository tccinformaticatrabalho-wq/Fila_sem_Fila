import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";

import {
    get,
    getDatabase,
    onValue,
    ref,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "filasemfila.firebaseapp.com",
    databaseURL: "https://filasemfila-default-rtdb.firebaseio.com",
    projectId: "filasemfila",
    storageBucket: "filasemfila.firebasestorage.app",
    messagingSenderId: "189346378434",
    appId: "1:189346378434:web:b977d0aa13e5655ba8015b"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ELEMENTOS HTML
const displaySenhaAtual = document.getElementById("senha-atual");
const mensagemStatus = document.getElementById("mensagem-status");
const displayFaltam = document.getElementById("contador-faltam");
const feedback = document.getElementById("feedback-usuario");

// REFERÊNCIAS FIREBASE
const senhaAtualRef = ref(database, "senha_atual");
const ultimaSenhaRef = ref(database, "ultima_senha_gerada");

// SENHA SALVA NO NAVEGADOR
const senhaSalva = localStorage.getItem("minha_senha");

// MOSTRA FEEDBACK SE JÁ EXISTIR SENHA
if (senhaSalva && feedback) {
    feedback.classList.remove("hidden");
}

// ESCUTA ALTERAÇÕES DA FILA
onValue(
    senhaAtualRef,
    (snapshot) => {
        const senhaChamando = snapshot.val();

        displaySenhaAtual.textContent = formatarSenha(senhaChamando);

        atualizarCalculo(senhaChamando);
    },
    (error) => {
        console.error("Erro ao acompanhar fila:", error);

        alert("Erro ao acompanhar fila.");
    }
);

// GERAR SENHA ÚNICA
window.gerarNovaSenha = function gerarNovaSenha() {

    // EVITA GERAR MAIS DE UMA SENHA NO MESMO CELULAR
    const senhaExistente = localStorage.getItem("minha_senha");

    if (senhaExistente) {

        alert(`Você já possui a senha ${formatarSenha(senhaExistente)}`);

        return;
    }

    runTransaction(ultimaSenhaRef, (valorAtual) => {

        const senhaAtual = Number(valorAtual) || 0;

        // REINICIA EM 1 APÓS 999
        return senhaAtual >= 999 ? 1 : senhaAtual + 1;

    })
    .then((result) => {

        if (!result.committed) return;

        const novaSenha = result.snapshot.val();

        salvarSenhaUsuario(novaSenha);

        mensagemStatus.textContent = `Sua senha é ${formatarSenha(novaSenha)}`;

        displayFaltam.textContent = "Aguarde sua chamada.";

        feedback.classList.remove("hidden");

    })
    .catch((error) => {

        console.error("Erro ao gerar senha:", error);

        alert("Não foi possível gerar senha.");
    });
};

// SALVA SENHA NO NAVEGADOR
function salvarSenhaUsuario(numero) {

    localStorage.setItem("minha_senha", String(numero));

    get(senhaAtualRef)
        .then((snapshot) => {

            atualizarCalculo(snapshot.val());

        })
        .catch((error) => {

            console.error("Erro ao atualizar fila:", error);
        });
}

// ATUALIZA STATUS DA FILA
function atualizarCalculo(senhaChamando) {

    const minhaSenha = localStorage.getItem("minha_senha");

    if (!minhaSenha) {
        return;
    }

    if (senhaChamando === null || senhaChamando === undefined) {
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

    // AINDA NÃO CHEGOU
    if (diferenca > 0) {

        mensagemStatus.textContent = "Sua vez está chegando!";

        displayFaltam.textContent = `Faltam ${diferenca} pessoas`;

        return;
    }

    // É A VEZ
    if (diferenca === 0) {

        mensagemStatus.textContent = "É A SUA VEZ!";

        displayFaltam.textContent = "Dirija-se ao balcão.";

        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }

        return;
    }

    // JÁ PASSOU
    mensagemStatus.textContent = "Sua senha já passou.";

    displayFaltam.textContent = "";
}

// FORMATA SENHA
function formatarSenha(senha) {

    if (senha === null || senha === undefined || senha === "") {
        return "00";
    }

    return String(senha).padStart(2, "0");
}

// LIMPAR SENHA (OPCIONAL)
window.limparSenha = function limparSenha() {

    localStorage.removeItem("minha_senha");

    mensagemStatus.textContent = "";

    displayFaltam.textContent = "";

    feedback.classList.add("hidden");

    alert("Senha removida.");
};
