
import { todos, darkmode } from "./stores.js";

darkmode.subscribe(oldDarkmode => {
    let darkmodeVal = oldDarkmode;
    localStorage.setItem("darkmode" , darkmodeVal);
});

todos.subscribe(oldTodos => {
    let oldTodosVal = oldTodos;
    localStorage.setItem("todos" ,JSON.stringify(oldTodosVal));
});