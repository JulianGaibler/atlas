<script>
  export let title = 'Title'
</script>

<header class="rowBox">
  <div class="title">{title}</div>
  <slot />
</header>

<style lang="scss">
  header {
    height: var(--size-medium);
    display: flex;
    align-items: center;

    .title {
      padding-left: 8px;
      font-weight: 600;
      text-transform: capitalize;
      flex-grow: 1;
    }
  }
</style>
