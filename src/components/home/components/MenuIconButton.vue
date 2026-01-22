<template>
  <div tabindex="0" role="menuitem" class="lv-menu-item lv-menu-item-size-default" :id="id">
    <div class="icon-container-XAovJs" style="--menu-icon-size:40px">
      <div :class="containerClass">
        <div class="content-XAjJup">
          <div class="icon-menu-m2Y0RB">
            <div class="icon-wrap-tBuhBU hide-itzP3D sf-hidden">
              <slot name="icon-filled"></slot>
            </div>
            <div class="icon-wrap-tBuhBU">
              <slot name="icon"></slot>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  id: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  containerClass: {
    type: String,
    default: ''
  }
})
</script>
