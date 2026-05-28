import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";

import {
    get,
    getDatabase,
    onValue,
    ref,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-database.js";

// FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyBk7mgMUTUwqRe2bSVDtvbJZ80g6_kP3ug",
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

// SENHA SALVA
const senhaSalva = localStorage.getItem("minha_senha");

// MOSTRA FEEDBACK
if (senhaSalva) {

    feedback.classList.remove("hidden");
}

// ESCUTA ALTERAÇÃO DA FILA
onValue(
    senhaAtualRef,

    (snapshot) => {

        const senhaChamando = snapshot.val();

        displaySenhaAtual.textContent =
            formatarSenha(senhaChamando);

        atualizarCalculo(senhaChamando);
    },

    (error) => {

        console.error(error);

        alert("Erro ao acompanhar fila.");
    }
);

// GERAR NOVA SENHA
window.gerarNovaSenha = function () {

    const senhaExistente =
        localStorage.getItem("minha_senha");

    // EVITA DUPLICIDADE
    if (senhaExistente) {

        alert(
            `Você já possui a senha ${formatarSenha(senhaExistente)}`
        );

        return;
    }

    runTransaction(
        ultimaSenhaRef,

        (valorAtual) => {

            const senhaAtual =
                Number(valorAtual) || 0;

            // REINICIA APÓS 999
            return senhaAtual >= 999
                ? 1
                : senhaAtual + 1;
        }
    )

    .then((result) => {

        if (!result.committed) return;

        const novaSenha =
            result.snapshot.val();

        salvarSenhaUsuario(novaSenha);

        mensagemStatus.textContent =
            `Sua senha é ${formatarSenha(novaSenha)}`;

        displayFaltam.textContent =
            "Aguarde sua chamada.";

        feedback.classList.remove("hidden");
    })

    .catch((error) => {

        console.error(error);

        alert("Erro ao gerar senha.");
    });
};

// SALVAR SENHA
function salvarSenhaUsuario(numero) {

    localStorage.setItem(
        "minha_senha",
        String(numero)
    );

    get(senhaAtualRef)

    .then((snapshot) => {

        atualizarCalculo(snapshot.val());
    })

    .catch((error) => {

        console.error(error);
    });
}

// ATUALIZA FILA
function atualizarCalculo(senhaChamando) {

    const minhaSenha =
        localStorage.getItem("minha_senha");

    if (!minhaSenha) return;

    if (
        senhaChamando === null ||
        senhaChamando === undefined
    ) {
        return;
    }

    const atual =
        Number.parseInt(senhaChamando, 10);

    const minha =
        Number.parseInt(minhaSenha, 10);

    if (
        Number.isNaN(atual) ||
        Number.isNaN(minha)
    ) {

        mensagemStatus.textContent =
            "Erro ao calcular posição.";

        displayFaltam.textContent = "";

        return;
    }

    const diferenca = minha - atual;

    // AINDA NÃO CHEGOU
    if (diferenca > 0) {

        mensagemStatus.textContent =
            "Sua vez está chegando!";

        displayFaltam.textContent =
            `Faltam ${diferenca} pessoas`;

        return;
    }

    // É A VEZ
    if (diferenca === 0) {

        mensagemStatus.textContent =
            "É A SUA VEZ!";

        displayFaltam.textContent =
            "Dirija-se ao balcão.";

        // VIBRAÇÃO
        if (navigator.vibrate) {

            navigator.vibrate([
                200,
                100,
                200
            ]);
        }

        return;
    }

    // SENHA PASSOU
    mensagemStatus.textContent =
        "Sua senha já passou.";

    displayFaltam.textContent = "";
}

// FORMATAR SENHA
function formatarSenha(senha) {

    if (
        senha === null ||
        senha === undefined ||
        senha === ""
    ) {

        return "00";
    }

    return String(senha)
        .padStart(2, "0");
}

// RESETAR FILA
window.resetarFila = function () {

    const confirmar =
        confirm("Deseja resetar a fila?");

    if (!confirmar) return;

    Promise.all([

        runTransaction(
            ultimaSenhaRef,
            () => 0
        ),

        runTransaction(
            senhaAtualRef,
            () => 0
        )

    ])

    .then(() => {

        localStorage.removeItem(
            "minha_senha"
        );

        alert("Fila resetada.");

        location.reload();
    })

    .catch((error) => {

        console.error(error);

        alert("Erro ao resetar fila.");
    });
};

// LIMPAR MINHA SENHA
window.limparSenha = function () {

    localStorage.removeItem(
        "minha_senha"
    );

    mensagemStatus.textContent = "";

    displayFaltam.textContent = "";

    feedback.classList.add("hidden");

    alert("Senha removida.");
};
