<script>
  import { fade } from "svelte/transition";

  let quote;
  function getQuote() {
    let url = "https://api.quotable.io/random";
    fetch(url)
      .then(res => res.json())
      .then(data => {
        quote = data;
      });
  }
  getQuote();
</script>

<style>
  p span {
    float: right;
    font-style: italic;
    color: darkgray;
  }
  p {
    font-family: Verdana, Geneva, Tahoma, sans-serif;
    /* top: 40px; */
    padding: 10px 40px;
    margin: 0px;
    text-align: center;
    font: 1.5em;
    font-weight: 500;
    cursor: pointer;
  }
</style>

{#if quote != undefined}
  <p on:click={getQuote} transition:fade={{ duration: 2000 }}>
    {quote.content}
    <span>- {quote.author}</span>
  </p>
{/if}
