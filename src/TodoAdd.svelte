<script>
  import { todos } from "./stores.js";

  let newTodoIn = "";
  let newHr = "";
  let newMin = "";

  const onSubmit = e => {
    e.preventDefault();
    if (!newTodoIn) return;
    if(!newHr || !newMin) return;

    let numHr = ("0" + Number(newHr)).slice(-2);
    let numMin = ("0" + Number(newMin)).slice(-2);

    let time = `${numHr}:${numMin}`;

    todos.update(todosVal => [
      {
        id: getID(),
        title: newTodoIn,
        time: time
      },
      ...todosVal
    ]);

    newTodoIn = "";
    newHr = "";
    newMin = "";
  }

  let getID = () =>
    Math.random()
      .toString(36)
      .substring(7);
</script>

<style>
  form {
    width: 100%;

  }
  .newTodo {
    width: 50%;
    margin-right: 5%;
  }
  .hr {
    width: 12%;
    /* font-size: 0.8em; */
  }
  .min{
    width: 12%;
    /* font-size: 0.8em; */
  }


</style>
<form on:submit={onSubmit}>
  <input
    type="text"
    placeholder="Enter a new todo"
    bind:value={newTodoIn}
    class="input newTodo"
  />

  <input
    type="text"
    placeholder="HR"
    bind:value={newHr}
    class="input hr"
  />
  <input
    type="text"
    placeholder="Min"
    bind:value={newMin}
    class="input min"
  />

  <input type="submit" class="submit"/>


</form>