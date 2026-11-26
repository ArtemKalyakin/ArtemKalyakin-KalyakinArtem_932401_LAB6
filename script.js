/* ---------- Калькулятор ---------- */
const form = document.getElementById('calc-form');

if (form) {
    const resultEl = document.getElementById('result');
    const expressionEl = document.getElementById('expression');
    const errorEl = document.getElementById('error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const a = document.getElementById('a').value.trim();
        const b = document.getElementById('b').value.trim();
        const op = form.querySelector('input[name="op"]:checked').value;

        errorEl.textContent = '';
        expressionEl.textContent = '';
        resultEl.textContent = '…';

        try {
            const params = new URLSearchParams({ a, b, op });
            const response = await fetch(`/api/calc?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                errorEl.textContent = data.error || 'Ошибка запроса';
                resultEl.textContent = '—';
                return;
            }

            resultEl.textContent = data.result;
            expressionEl.textContent = `${data.expression} = ${data.result}`;
        } catch (err) {
            console.warn('Сервер недоступен, считаю локально:', err);
            const local = calculateLocally(a, b, op);
            if (local.error) {
                errorEl.textContent = local.error;
                resultEl.textContent = '—';
            } else {
                resultEl.textContent = local.result;
                expressionEl.textContent = `${local.expression} = ${local.result}`;
            }
        }
    });
}

function calculateLocally(a, b, op) {
    const numA = Number(a);
    const numB = Number(b);
    if (a.trim() === '' || b.trim() === '' ||
        !Number.isFinite(numA) || !Number.isFinite(numB)) {
        return { error: 'Параметры a и b должны быть числами' };
    }
    if (!['+', '-', '*', '/'].includes(op)) {
        return { error: 'Недопустимая операция' };
    }
    if (op === '/' && numB === 0) {
        return { error: 'Деление на ноль невозможно' };
    }
    let result;
    switch (op) {
        case '+': result = numA + numB; break;
        case '-': result = numA - numB; break;
        case '*': result = numA * numB; break;
        case '/': result = numA / numB; break;
    }
    const clean = Number(result.toPrecision(12));
    return { result: clean, expression: `${numA}${op}${numB}` };
}

/* ---------- Service Worker ---------- */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then(reg => console.log('[PWA] SW зарегистрирован:', reg.scope))
            .catch(err => console.error('[PWA] Ошибка SW:', err));
    });
}