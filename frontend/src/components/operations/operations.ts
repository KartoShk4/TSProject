import { HttpUtils } from "../../utils/http-utils";
import { AuthUtils } from "../../utils/auth-utils";
import * as bootstrap from 'bootstrap';

// Определяем интерфейсы для категорий и операций
interface Category {
    id: number;
    name: string;
}

export class Operations {
    private readonly openNewRoute: (url: string | URL | null | undefined) => Promise<void>;
    private btnCreateIncome: HTMLAnchorElement | null;
    private btnCreateExpenses: HTMLAnchorElement | null;
    private readonly periodBtns: NodeListOf<HTMLButtonElement>;
    private readonly period: string;
    private dateFromValue: string | null;
    private dateToValue: string | null;
    private incomeCategories: Category[];
    private expenseCategories: Category[];
    private toast?: bootstrap.Toast;

    constructor(openNewRoute: (url: string | URL | null | undefined) => Promise<void>) {
        this.openNewRoute = openNewRoute;
        this.btnCreateIncome = null;
        this.btnCreateExpenses = null;
        this.periodBtns = document.querySelectorAll('.filter');
        this.period = 'today';
        this.dateFromValue = null;
        this.dateToValue = null;
        this.incomeCategories = [];
        this.expenseCategories = [];

        this.changeToDataText();
        this.init();
    }

    private async init(): Promise<void> {
        // Проверка авторизации пользователя
        if (!AuthUtils.getAuthInfo(AuthUtils.accessTokenKey) || !AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey)) {
            await this.openNewRoute('/login');
            return;
        }

        this.pressBtn();
        await this.updateButtonStates();
        this.selectInterval();
        this.initializeToast();
    }

    // Обрабатываем фокус на input, меняя тип на date
    private changeToDataText(): void {
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
                }, 200);
            }
        }, true);
    }

    private initializeToast(): void {
        const toastLiveExample = document.getElementById('liveToast');
        if (toastLiveExample) {
            this.toast = new bootstrap.Toast(toastLiveExample);
        }
    }

    private showToast(message: string): void {
        const toastMessage = document.getElementById('toastMessage');
        if (toastMessage && this.toast) {
            toastMessage.innerHTML = message;
            this.toast.show();
        }
    }

    private pressBtn(): void {
        this.btnCreateIncome = document.getElementById('btn-create-income') as HTMLAnchorElement | null;
        this.btnCreateExpenses = document.getElementById('btn-create-expenses') as HTMLAnchorElement | null;
    }

    private async updateButtonStates(): Promise<void> {
        this.incomeCategories = await this.getIncomeCategories();
        this.expenseCategories = await this.getExpenseCategories();

        this.toggleButtonState(this.btnCreateIncome, this.incomeCategories, '/create-operations?type=Доход', '/income');
        this.toggleButtonState(this.btnCreateExpenses, this.expenseCategories, '/create-operations?type=Расход', '/expenses');
    }

    private toggleButtonState(button: HTMLAnchorElement | null, categories: Category[], href: string, categoryLink: string): void {
        if (!button) return;

        if (categories.length === 0) {
            button.classList.add('disabled');
            button.removeAttribute('href');
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.showToast(`Категории отсутствуют. Создайте категории <a href="${categoryLink}" style="color: #0d6efd; text-decoration: none;">здесь</a>.`);
            });
        } else {
            button.classList.remove('disabled');
            button.setAttribute('href', href);
        }
    }

    private async getIncomeCategories(): Promise<Category[]> {
        const result = await HttpUtils.request('/categories/income');
        return result.error ? [] : result.response;
    }

    private async getExpenseCategories(): Promise<Category[]> {
        const result = await HttpUtils.request('/categories/expense');
        return result.error ? [] : result.response;
    }

    private selectInterval(): void {
        this.getOperations(this.period);
        const activeToday = this.periodBtns[0];
        activeToday.classList.add('active-btn');

        this.periodBtns.forEach((item) => {
            item.addEventListener('click', () => {
                this.periodBtns.forEach((itm) => itm.classList.remove('active-btn'));
                item.classList.add('active-btn');

                const intervalType = item.getAttribute('id');
                this.dateFromValue = null;
                this.dateToValue = null;

                if (intervalType === 'interval') {
                    document.getElementById('calendar-from')?.addEventListener('change', () => this.getOperationsFromInterval());
                    document.getElementById('calendar-to')?.addEventListener('change', () => this.getOperationsFromInterval());
                } else {
                    this.getOperations(intervalType || 'today');
                }
            });
        });
    }

    private getOperationsFromInterval(): void {
        if (this.dateFromValue && this.dateToValue) {
            this.getOperations('interval', this.dateFromValue, this.dateToValue);
        }
    }

    private async getOperations(period: string, dateFrom?: string, dateTo?: string): Promise<void> {
        let params = `?period=${period}`;
        if (period === 'interval' && dateFrom && dateTo) {
            params += `&dateFrom=${dateFrom}&dateTo=${dateTo}`;
        }

        try {
            const res = await HttpUtils.request(`/operations${params}`);
            if (res.error) throw new Error(String(res.error));

            // Допиши метод отрисовки операций
        } catch (e) {
            console.error(e);
        }
    }
}
