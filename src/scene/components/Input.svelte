<script>
  export let id = null
  export let value = null
  export let name = null
  export let borders = false
  export let disabled = false
  export let iconText = null
  export let iconName = null //pass svg data into this var by importing an svg in parent
  export let placeholder = 'Input something here...'
  export { className as class }

  let className = ''
</script>

{#if iconText || iconName}
  <div class="input {className}">
    <div class="icon">
      <div class="inner">
        {#if iconText}{iconText}{:else}{@html iconName}{/if}
      </div>
    </div>
    <input
      type="input"
      bind:value
      on:blur
      {id}
      {name}
      {disabled}
      {placeholder}
      class="indent"
      class:borders
    />
  </div>
{:else}
  <div class="input {className}">
    <input type="input" bind:value on:blur {id} {name} {disabled} {placeholder} class:borders />
  </div>
{/if}

<style lang="scss">
  .input {
    position: relative;
  }

  input {
    box-sizing: border-box;
    font-size: var(--font-size-xsmall);
    font-weight: var(--font-weight-normal);
    letter-spacing: var(--font-letter-spacing-neg-xsmall);
    line-height: var(--line-height);
    position: relative;
    display: flex;
    overflow: visible;
    align-items: center;
    width: 100%;
    height: 30px;
    margin: 1px 0 1px 0;
    padding: var(--size-xxsmall) var(--size-xxxsmall) var(--size-xxsmall) var(--size-xxsmall);
    color: var(--black8);
    border: 1px solid transparent;
    border-radius: var(--border-radius-small);
    outline: none;
    background-color: var(--white);
  }
  input:hover,
  input:placeholder-shown:hover {
    color: var(--black8);
    border: 1px solid var(--black1);
    background-image: none;
  }
  input::selection {
    color: var(--black);
    background-color: var(--blue3);
  }
  input::placeholder {
    color: var(--black3);
    border: 1px solid transparent;
  }
  input:placeholder-shown {
    color: var(--black8);
    border: 1px solid var(--black1);
    background-image: none;
  }
  input:focus:placeholder-shown {
    border: 1px solid var(--blue);
    outline: 1px solid var(--blue);
    outline-offset: -2px;
  }
  input:disabled:hover {
    border: 1px solid transparent;
  }
  input:active,
  input:focus {
    color: var(--black);
    border: 1px solid var(--blue);
    outline: 1px solid var(--blue);
    outline-offset: -2px;
  }
  input:disabled {
    position: relative;
    color: var(--black3);
    background-image: none;
  }
  input:disabled:active {
    outline: none;
  }

  .borders {
    border: 1px solid var(--black1);
    background-image: none;
  }
  .borders:disabled {
    border: 1px solid transparent;
    background-image: none;
  }
  .borders:disabled:placeholder-shown {
    border: 1px solid transparent;
    background-image: none;
  }
  .borders:disabled:placeholder-shown:active {
    border: 1px solid transparent;
    outline: none;
  }
  .borders:placeholder-shown {
    border: 1px solid var(--black1);
    background-image: none;
  }

  .indent {
    padding-left: 32px;
  }

  .icon {
    position: absolute;
    top: -1px;
    left: 0;
    width: var(--size-medium);
    height: var(--size-medium);
    z-index: 1;
    display: flex;
    .inner {
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: default;
      color: var(--black3);
      width: var(--size-medium);
      height: var(--size-medium);
      font-family: var(--font-stack);
      font-size: var(--font-size-xsmall);
      user-select: none;
    }
  }
</style>
