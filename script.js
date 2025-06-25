// script.js (da sua página principal)

document.addEventListener('DOMContentLoaded', () => {
    const btnSeabass = document.getElementById('btnSeabass');
    const btnSalmon = document.getElementById('btnSalmon');
    const btnSole = document.getElementById('btnSole');

    if (btnSeabass) {
        btnSeabass.addEventListener('click', () => {
            console.log('Botão "Seabass" clicado! Redirecionando para a página de detalhes...');
            // *** LINHA ALTERADA AQUI ***
            window.location.href = './Seabass/index.html'; // Redireciona para a nova página
        });
    }

    if (btnSalmon) {
        btnSalmon.addEventListener('click', () => {
            console.log('Botão "Salmon" clicado!');
            // Futuramente: Redirecionar para a página de Salmon
            window.location.href = './Salmon/salmon-index.html'; // Redireciona para a nova página


        });
    }

    if (btnSole) {
        btnSole.addEventListener('click', () => {
            console.log('Botão "Sole" clicado!');
            // Futuramente: Redirecionar para a página de Sole
            window.location.href = './Sole/sole-index.html'; // Redireciona para a nova página

        });
    }

    if (btnShrimp) {
        btnShrimp.addEventListener('click', () => {
            console.log('Botão "Shrimp" clicado!');
            // Futuramente: Redirecionar para a página de Sole
            window.location.href = './Shrimp/shrimp-index.html'; // Redireciona para a nova página

        });
    }

    if (btnTurbot) {
        btnTurbot.addEventListener('click', () => {
            console.log('Botão "Turbot" clicado!');
            // Futuramente: Redirecionar para a página de Sole
            window.location.href = './Turbot/turbot-index.html'; // Redireciona para a nova página

        });
    }

    if (btnRainowTrout) {
        btnRainowTrout.addEventListener('click', () => {
            console.log('Botão "RainowTrout" clicado!');
            // Futuramente: Redirecionar para a página de Sole
            window.location.href = './RainowTrout/rainowtrout-index.html'; // Redireciona para a nova página

        });
    }

    if (btnTilapia) {
        btnTilapia.addEventListener('click', () => {
            console.log('Botão "Tilapia" clicado!');
            // Futuramente: Redirecionar para a página de Sole
            window.location.href = './Tilapia/tilapia-index.html'; // Redireciona para a nova página

        });
    }

    if (btnSeabream) {
        btnSeabream.addEventListener('click', () => {
            console.log('Botão "Seabream" clicado!');
            // Futuramente: Redirecionar para a página de Sole
            window.location.href = './Seabream/seabream-index.html'; // Redireciona para a nova página

        });
    }

    if (btnLVShrimp) {
        btnLVShrimp.addEventListener('click', () => {
            console.log('Botão "LVShrimp" clicado!');
            // Futuramente: Redirecionar para a página de Sole
            window.location.href = './LVShrimp/lvshrimp-index.html'; // Redireciona para a nova página

        });
    }

    if (btnClamD) {
        btnClamD.addEventListener('click', () => {
            console.log('Botão "btnClamD" clicado!');
            // Futuramente: Redirecionar para a página de Sole
            window.location.href = './ClamDecussatus/clam-decussatus-index.html'; // Redireciona para a nova página

        });
    }

    if (btnClamP) {
        btnClamP.addEventListener('click', () => {
            console.log('Botão "btnClamD" clicado!');
            // Futuramente: Redirecionar para a página de Sole
            window.location.href = './ClamPhilippinarum/clam-philippinarum-index.html'; // Redireciona para a nova página

        });
    }

    if (btnDanio) {
        btnDanio.addEventListener('click', () => {
            console.log('Botão "btnDanio" clicado!');
            // Futuramente: Redirecionar para a página de Sole
            window.location.href = './DanioRerio/danio-index.html'; // Redireciona para a nova página

        });
    }

    if (btnsample) {
        btnsample.addEventListener('click', () => {
            console.log('Botão "Ask for Sample" clicado! Redirecionando para a página de detalhes...');
            // *** LINHA ALTERADA AQUI ***
            window.location.href = './PedidosAmostra/pedido.html'; // Redireciona para a nova página
        });
    }
});