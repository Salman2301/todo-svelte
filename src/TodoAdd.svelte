<script>
  import { todos } from "./stores.js";

  let newTodoIn = "";
  const handleKeyDown = e => {
    let isEnter = e.key === "Enter";
    if (!newTodoIn) return;
    // newTodo = newTodoIn;
    if (!isEnter) return;
    todos.update(todosVal => [
      ...todosVal,
      {
        id: getID(),
        title: newTodoIn
      }
    ]);
    newTodoIn = "";
  };

  let getID = () =>
    Math.random()
      .toString(36)
      .substring(7);
</script>

<input
  type="text"
  placeholder="Enter a new todo"
  bind:value={newTodoIn}
  on:keydown={handleKeyDown}
  style="width:300px" />
