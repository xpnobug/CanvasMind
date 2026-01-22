<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:visible', 'save'])

const localTitle = ref(props.title)
const localDescription = ref(props.description)

watch(() => props.visible, (val) => {
  if (val) {
    localTitle.value = props.title
    localDescription.value = props.description
  }
})

const close = () => {
  emit('update:visible', false)
}

const save = () => {
  emit('save', {
    title: localTitle.value,
    description: localDescription.value
  })
  emit('update:visible', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="close">
        <div class="modal-container">
          <div class="modal-header">
            <h3 class="modal-title">项目设定</h3>
            <button class="modal-close" @click="close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">项目名称</label>
              <div class="input-wrapper">
                <input 
                  v-model="localTitle" 
                  class="form-input" 
                  type="text" 
                  maxlength="50"
                  placeholder="请输入项目名称"
                />
                <span class="char-count">{{ localTitle.length }}/50</span>
              </div>
            </div>
            
            <div class="form-group">
              <div class="form-label-row">
                <label class="form-label">全局设定</label>
                <button class="add-button" type="button">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
              <textarea 
                v-model="localDescription" 
                class="form-textarea" 
                rows="4"
                placeholder="设置 Agent 的全局行为规则，如风格、语气等"
              ></textarea>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-cancel" @click="close">取消</button>
            <button class="btn btn-save" @click="save">保存</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-container {
  width: 420px;
  background: rgba(30, 33, 38, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.modal-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.form-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.add-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.06);
  border: none;
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.add-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  height: 40px;
  padding: 0 60px 0 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--brand-main-default);
}

.form-input::placeholder {
  color: var(--text-tertiary);
}

.char-count {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: var(--text-tertiary);
}

.form-textarea {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--brand-main-default);
}

.form-textarea::placeholder {
  color: var(--text-tertiary);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.btn {
  height: 36px;
  padding: 0 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-save {
  background: var(--brand-main-default);
  color: #fff;
}

.btn-save:hover {
  opacity: 0.9;
}

/* 弹窗动画 */
.modal-enter-active {
  animation: modal-in 0.25s ease-out;
}

.modal-leave-active {
  animation: modal-in 0.2s ease-in reverse;
}

.modal-enter-active .modal-container {
  animation: modal-content-in 0.25s ease-out;
}

.modal-leave-active .modal-container {
  animation: modal-content-in 0.2s ease-in reverse;
}

@keyframes modal-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modal-content-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
