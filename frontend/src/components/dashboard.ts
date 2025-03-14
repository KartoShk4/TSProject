import {AuthUtils} from "../utils/auth-utils";
import {HttpUtils} from "../utils/http-utils";
import {createPopper, Instance} from "@popperjs/core";
import { Tooltip } from 'bootstrap';
import {Chart, ArcElement, Legend, PieController, ChartTypeRegistry} from 'chart.js';

type Operation = {
    type: "income" | "expense";
    category: string;
    amount: number;
}

export class Dashboard {
    private readonly openNewRoute: (route: string) => void;
    private periodBtns: NodeListOf<HTMLButtonElement> | undefined;
    private operations: Operation[] | undefined;
    private period: string = 'today';
    private dateFromValue: string | null = null;
    private dateToValue: string | null = null;
    private mcIncome: HTMLCanvasElement | null | undefined;
    private mcExpense: HTMLCanvasElement | null | undefined;
    private chartIncome: Chart<keyof ChartTypeRegistry, number[], string> | null = null;
    private chartExpense: Chart<keyof ChartTypeRegistry, number[], string> | null = null;

    constructor(openNewRoute: (route: string) => void) {
        this.openNewRoute = openNewRoute;

        // Вынесли функцию вызова tooltip из конструктора
        this.tooltip();

        // Регистрация контроллеров и элементов диаграммы
        Chart.register(PieController, ArcElement, Legend);

        this.init();
        this.changeToDataText();
    }

    async init(): Promise<void> {
        // Проверка авторизации
        if (!AuthUtils.getAuthInfo(AuthUtils.accessTokenKey) || !AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey)) {
            return this.openNewRoute('/login');
        }

        this.periodBtns = document.querySelectorAll('.filter');
        this.operations = [];
        this.period = 'today';
        this.dateFromValue = null;
        this.dateToValue = null;
        this.mcIncome = document.getElementById('myChartIncome') as HTMLCanvasElement | null;
        this.mcExpense = document.getElementById('myChartExpenses') as HTMLCanvasElement | null;
        this.chartIncome = null;
        this.chartExpense = null;

        // Инициализация интервалов
        this.selectInterval();
    }

    chartJS(): void {
        // Уничтожаем предыдущие графики, если они есть
        if (this.chartIncome) this.chartIncome.destroy();
        if (this.chartExpense) this.chartExpense.destroy();

        // Получаем элементы для сообщений
        const noIncomeMessage = document.getElementById('no-income-message');
        const noExpenseMessage = document.getElementById('no-expense-message');

        // Скрываем сообщения по умолчанию
        if (noIncomeMessage) noIncomeMessage.style.display = 'none';
        if (noExpenseMessage) noExpenseMessage.style.display = 'none';

        const colors = [
            'rgb(220, 53, 69)',
            'rgb(253, 126, 20)',
            'rgb(255, 193, 7)',
            'rgb(32, 201, 151)',
            'rgb(13, 110, 253)',
        ];

        let incomeData: number[] = [];
        let expenseData: number[] = [];

        const incomeOperations = this.operations?.filter(itm => itm.type === 'income') || [];
        const expenseOperations = this.operations?.filter(itm => itm.type === 'expense') || [];
        const incomeCategories = incomeOperations.map(itm => itm.category);
        const incomeLabels = Array.from(new Set(incomeCategories));
        const expenseCategories = expenseOperations.map(itm => itm.category);
        const expenseLabels = Array.from(new Set(expenseCategories));

        incomeLabels.forEach(label => {
            let sum = 0;
            incomeOperations.forEach(itm => {
                if (label === itm.category) {
                    sum += itm.amount;
                }
            });
            incomeData.push(sum);
        });

        expenseLabels.forEach(label => {
            let sum = 0;
            expenseOperations.forEach(itm => {
                if (label === itm.category) {
                    sum += itm.amount;
                }
            });
            expenseData.push(sum);
        });

        // Обработка доходов
        if (incomeOperations.length > 0 && this.mcIncome) {
            const dataIncome = {
                labels: incomeLabels,
                datasets: [{
                    label: 'Доходы',
                    data: incomeData,
                    backgroundColor: colors,
                    hoverOffset: 4,
                }]
            };
            this.chartIncome = new Chart(this.mcIncome, {
                type: 'pie',
                data: dataIncome,
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Доходы',
                            font: {
                                size: 28
                            }
                        }
                    }
                }
            });
        } else if (noIncomeMessage) {
            // Если доходов нет, показываем сообщение
            noIncomeMessage.style.display = 'block';
        }

        // Обработка расходов
        if (expenseOperations.length > 0 && this.mcExpense) {
            const dataExpense = {
                labels: expenseLabels,
                datasets: [{
                    label: 'Расходы',
                    data: expenseData,
                    backgroundColor: colors,
                    hoverOffset: 4,
                }]
            };
            this.chartExpense = new Chart(this.mcExpense, {
                type: 'pie',
                data: dataExpense,
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Расходы',
                            font: {
                                size: 28
                            }
                        }
                    }
                }
            });
        } else if (noExpenseMessage) {
            // Если расходов нет, показываем сообщение
            noExpenseMessage.style.display = 'block';
        }
    }

    changeToDataText(): void {
        document.body.addEventListener('focusin', (event: Event) => {
            const target = event.target as HTMLInputElement;
            if (target.matches('#calendar-from, #calendar-to')) {
                target.type = 'date';
            }
        });

        document.body.addEventListener('blur', (event: Event) => {
            const target = event.target as HTMLInputElement;
            if (target.matches('#calendar-from, #calendar-to') && !target.value) {
                setTimeout(() => {
                    target.type = 'text';
                    target.placeholder = 'Дата';
                }, 200);  // 200 мс, чтобы избежать мгновенного скрытия
            }
        }, true);
    }

    // Работа с tooltip bootstrap
    tooltip(): void {
        const button = document.querySelector('#button') as HTMLButtonElement | null;
        const tooltipElement = document.querySelector('#tooltip') as HTMLElement | null;

        if (button && tooltipElement) {
            // Инициализируем тултип Bootstrap
            new Tooltip(button, {
                title: 'Tooltip content', // Текст тултипа
                placement: 'bottom',         // Расположение тултипа
            });

            // Инициализируем Popper.js для дополнительной настройки, если нужно
            this.initPopper(button, tooltipElement);
        }
    }

    initPopper(button: HTMLButtonElement, tooltipElement: HTMLElement): void {
        const popperInstance: Instance = createPopper(button, tooltipElement, {
            placement: 'top',
            modifiers: [
                {
                    name: 'offset',
                    options: {
                        offset: [0, 8],
                    },
                },
            ],
        });

        // Показываем тултип
        button.addEventListener('mouseenter', () => {
            tooltipElement.setAttribute('data-show', '');
            popperInstance.update(); // Обновляем позицию
        });

        // Скрываем тултип
        button.addEventListener('mouseleave', () => {
            tooltipElement.removeAttribute('data-show');
        });
    }

    // Управление фильтрами
    selectInterval(): void {
        if (!this.periodBtns) return;

        this.getOperations(this.period);
        const activeToday: HTMLButtonElement = this.periodBtns[0];
        activeToday.classList.add('active-btn');
        this.periodBtns.forEach(item => {
            item.addEventListener('click', () => {
                if (this.periodBtns) {
                    this.periodBtns.forEach(itm => {
                        itm.classList.remove('active-btn');
                    });
                }
                item.classList.add('active-btn');
                const intervalType = item.getAttribute('id');
                const dateFromInput = document.getElementById('calendar-from') as HTMLInputElement | null;
                const dateToInput = document.getElementById('calendar-to') as HTMLInputElement | null;
                switch (intervalType) {
                    case 'today':
                        this.getOperations('today');
                        break;
                    case 'week':
                        this.getOperations('week');
                        break;
                    case 'month':
                        this.getOperations('month');
                        break;
                    case 'year':
                        this.getOperations('year');
                        break;
                    case 'all':
                        this.getOperations('all');
                        break;
                    case 'interval':
                        if (this.chartIncome && this.chartExpense) {
                            this.chartIncome.destroy();
                            this.chartExpense.destroy();
                        }
                        if (dateFromInput) {
                            dateFromInput.addEventListener('change', () => {
                                this.dateFromValue = dateFromInput.value;
                                this.getOperationsFromInterval();
                            });
                        }
                        if (dateToInput) {
                            dateToInput.addEventListener('change', () => {
                                this.dateToValue = dateToInput.value;
                                this.getOperationsFromInterval();
                            });
                        }
                        this.getOperationsFromInterval();
                        break;
                }
            });
        });
    }

    getOperationsFromInterval(): void {
        if (this.dateFromValue && this.dateToValue) {
            this.getOperations('interval', this.dateFromValue, this.dateToValue);
        }
    }

    // Запрос на интервал
    async getOperations(period: string, dateFrom?: string, dateTo?: string): Promise<void> {
        let params = `?period=${period}`;
        if (period === 'interval' && dateFrom && dateTo) {
            params += `&dateFrom=${dateFrom}&dateTo=${dateTo}`;
        }
        try {
            const res = await HttpUtils.request(`/operations${params}`);
            if (!res || res.error) {
                return;
            }
            if (!Array.isArray(res.response)) {
                return;
            }
            this.operations = res.response;
            // ChartJS
            this.chartJS();
        } catch (e) {
            console.error(e);
        }
    }
}