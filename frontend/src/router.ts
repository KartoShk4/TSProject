import {SignUp} from "./components/auth/sign-up";
import {Login} from "./components/auth/login";
import {Dashboard} from "./components/dashboard";
import {Operations} from "./components/operations/operations";
import {EditedOperations} from "./components/operations/editedOperations";
import {CreateOperations} from "./components/operations/createOperations";
import {Income} from "./components/income/income";
import {EditedCategoriesIncome} from "./components/income/editedCategoriesIncome";
import {CreateCategoriesIncome} from "./components/income/createCategoriesIncome";
import {IncomeDelete} from "./components/income/incomeDelete";
import {Expenses} from "./components/expenses/expenses";
import {EditedCategoriesExpenses} from "./components/expenses/editedCategoriesExpenses";
import {CreateCategoriesExpenses} from "./components/expenses/createCategoriesExpenses";
import {ExpensesDelete} from "./components/expenses/expensesDelete";
import {Logout} from "./components/auth/logout";
import {Layout} from "./components/layout";
import * as events from "node:events";

interface Route {
    route: string;
    // Указываем что свойство необязательное
    title?: string;
    filePathTemplate?: string;
    // Указываем что свойство необязательное
    useLayout?: string | false;
    load?: () => void | Promise<void>
    ;
}

export class Router {
    private titlePageElement: HTMLElement | null;
    private readonly contentPageElement: HTMLElement | null;
    private routes: Route[];

    constructor() {
        this.titlePageElement = document.getElementById('title');
        this.contentPageElement = document.getElementById('content');

        // Вызываем функцию, для удобства перенесли её из конструктора.
        this.initEvents();

        this.routes = [
            {
                route: '/',
                title: 'Главная',
                filePathTemplate: '/templates/dashboard.html',
                useLayout: '/templates/layout.html',
                load: () => {
                    new Dashboard(this.openNewRoute.bind(this));
                    new Layout();
                },
            },
            {
                route: '/login',
                title: 'Авторизация',
                filePathTemplate: '/templates/login.html',
                useLayout: false,
                load: () => {
                    new Login(this.openNewRoute.bind(this));
                },
            },
            {
                route: '/sign-up',
                title: 'Регистрация',
                filePathTemplate: '/templates/sign-up.html',
                useLayout: false,
                load: () => {
                    new SignUp(this.openNewRoute.bind(this));
                },
            },
            {
                route: '/operations',
                title: 'Доходы & Расходы',
                filePathTemplate: '/templates/operations/operations.html',
                useLayout: '/templates/layout.html',
                load: () => {
                    new Operations(this.openNewRoute.bind(this));
                    new Layout();
                },
            },
            {
                route: '/edited-operations',
                title: 'Редактирование доходов & расходов',
                filePathTemplate: '/templates/operations/editedOperations.html',
                useLayout: '/templates/layout.html',
                load: () => {
                    new EditedOperations(this.openNewRoute.bind(this));
                    new Layout();
                },
            },
            {
                route: '/create-operations',
                title: 'Создание доходов & расходов',
                filePathTemplate: '/templates/operations/createOperations.html',
                useLayout: '/templates/layout.html',
                load: () => {
                    new CreateOperations(this.openNewRoute.bind(this));
                    new Layout();
                },
            },
            {
                route: '/income',
                title: 'Доходы',
                filePathTemplate: '/templates/income/income.html',
                useLayout: '/templates/layout.html',
                load: () => {
                    new Income(this.openNewRoute.bind(this));
                    new Layout();
                },
            },
            {
                route: '/edited-categories-income',
                title: 'Редактирование доходов',
                filePathTemplate: '/templates/income/editedCategoriesIncome.html',
                useLayout: '/templates/layout.html',
                load: () => {
                    new EditedCategoriesIncome(this.openNewRoute.bind(this));
                    new Layout();
                },
            },
            {
                route: '/create-categories-income',
                title: 'Создание доходов',
                filePathTemplate: '/templates/income/createCategoriesIncome.html',
                useLayout: '/templates/layout.html',
                load: () => {
                    new CreateCategoriesIncome(this.openNewRoute.bind(this));
                    new Layout();
                },
            },
            {
                route: '/income/delete',
                load: () => {
                    new IncomeDelete(this.openNewRoute.bind(this));
                }
            },
            {
                route: '/expenses',
                title: 'Расходы',
                filePathTemplate: '/templates/expenses/expenses.html',
                useLayout: '/templates/layout.html',
                load: () => {
                    new Expenses(this.openNewRoute.bind(this));
                    new Layout();
                },
            },
            {
                route: '/edited-categories-expenses',
                title: 'Редактирование расходов',
                filePathTemplate: '/templates/expenses/editedCategoriesExpenses.html',
                useLayout: '/templates/layout.html',
                load: () => {
                    new EditedCategoriesExpenses(this.openNewRoute.bind(this));
                    new Layout();
                },
            },
            {
                route: '/create-categories-expenses',
                title: 'Создание расходов',
                filePathTemplate: '/templates/expenses/createCategoriesExpenses.html',
                useLayout: '/templates/layout.html',
                load: () => {
                    new CreateCategoriesExpenses(this.openNewRoute.bind(this));
                    new Layout();
                },
            },
            {
                route: '/expenses/delete',
                load: () => {
                    new ExpensesDelete(this.openNewRoute.bind(this));
                }
            },
            {
                route: '/logout',
                load: () => {
                    new Logout(this.openNewRoute.bind(this));
                }
            },
        ];
    }

    private initEvents(): void {
        // Отлавливаем момент, когда пользователь загрузил страницу
        window.addEventListener('DOMContentLoaded', this.activateRoute.bind(this));
        // Вызываем функцию когда поменялся URL
        window.addEventListener('popstate', this.activateRoute.bind(this));
        // Вызываем функцию по созданию нового роута вручную, в обход браузера
        document.addEventListener('click', this.clickHandler.bind(this));
    }

    private async openNewRoute(url: string | URL | null | undefined): Promise<void> {
        // Взяли старый URl
        const currentRoute = window.location.pathname;
        // В историю браузера вручную поменяли на новый URL
        history.pushState({}, '', url);
        await this.activateRoute(null, currentRoute);
    }

    async clickHandler(event: Event): Promise<void> {
        const target = event.target as HTMLElement;
        // Проверка на ссылку
        let element: HTMLAnchorElement | null = null;
        if (target.nodeName === 'A') {
            element = target as HTMLAnchorElement;
        } else if (target.parentNode && target.parentNode instanceof HTMLAnchorElement) {
            element = target.parentNode;
        }

        // Выполнили проверку на то что если ссылка является пустой или # или javascript:void(0), то мы её не обрабатываем.
        if (element) {
            event.preventDefault();
            const url: string = element.href.replace(window.location.origin, '');
            if (!url || url === '/#' || url.startsWith('javascript:void(0)')) {
                return;
            }
            await this.openNewRoute(url);
        }
    }

    private async activateRoute(event: Event | null, oldRoute: string| null = null): Promise<void> {
        // Получили адрес сайта после хоста
        const urlRoute: string = window.location.pathname;
        // Определили на какой именно странице находится пользователь
        const newRoute: Route | undefined = this.routes.find(item => item.route === urlRoute);

        if (newRoute) {
            // Проверяем, есть ли у страницы 'title'
            if (newRoute.title && this.titlePageElement) {
                // Если есть, то присваиваем странице нужный title
                this.titlePageElement.innerText = newRoute.title;
            }

            // Проверяем у newRoute есть pathTemplate
            if (newRoute.filePathTemplate && this.contentPageElement) {
                let contentBlock: HTMLElement | null = this.contentPageElement;
                // Если в нашем новом роуте есть useLayout (шаблон layout)
                if (newRoute.useLayout) {
                    // Если есть, то подставляем layout на страницу
                    this.contentPageElement.innerHTML = await fetch(newRoute.useLayout).then((res: Response): Promise<string> => res.text());
                    // Нашли на странице layout нужный нам id, куда будет подставляться весь контент.
                    contentBlock = document.getElementById('contend-layout');
                    // Для Layout (пока не используется)
                    document.body.classList.add('sidebar-mini');
                    document.body.classList.add('layout-fixed');
                } else {
                    // Для Layout (пока не используется)
                    document.body.classList.remove('sidebar-mini');
                    document.body.classList.remove('layout-fixed');
                }
                // Если pathTemplate есть, но нет useLayout, то подставляем контент на нужную страницу без layout.
                // @ts-ignore
                contentBlock.innerHTML = await fetch(newRoute.filePathTemplate).then((res: Response): Promise<string> => res.text());
            }

            // Проверяем наличие cвойства load у newRoute, а так же проверяем что там имеется функция и файл не пустой.
            if (newRoute.load && typeof newRoute.load === 'function') {
                // Если всё есть, то вызываем функцию нужной странице.
                newRoute.load();
            }
        } else {
            console.log('Такая страница не найдена');
            // Переводим пользователя на страницу авторизации в случае если страница не найдена
            history.pushState({}, '', '/login');
            await this.activateRoute(event);
        }
    }
}