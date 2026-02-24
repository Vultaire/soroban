<script setup lang="ts">

const problem = defineModel('problem')
const showAnswer = defineModel('showAnswer')

const props = defineProps({
    viewMode: String,
    selectedLanguage: String,
    kanji: Boolean,
    selectedVoice: {
        type: [SpeechSynthesisVoice, null],
    },
    speakByPart: Boolean,
})


const ja = computed(() => props.selectedLanguage == "ja-JP")

const utteranceIndex = ref(0)

function onInputKeyUp(event: KeyboardEvent) {
    console.log(typeof event)
    if (event.key == "Enter") {
        // fire event handler for parent to handle
        console.log('PLACEHOLDER: Event key pressed!')
        //onEnter()
    }
}

function toggleShowAnswer() {
    console.log('toggleShowAnswer called')
}

const problemWithAnswer = computed(() => "foobydooby") // fix this

</script>

<style scoped>
    input {
        width: 200px;
    }
</style>

<template>
    <div>
        <input v-if="viewMode == 'edit'" v-model="problem" type="text" autocomplete="off" @keyup="onInputKeyUp" />
        <template v-else>
            <button v-if="speakByPart">
                <template v-if="utteranceIndex == 0">
                    <template v-if="ja && kanji">聞き始める</template>
                    <template v-else-if="ja">ききはじめる</template>
                    <template v-else>Start listening</template>
                </template>
                <template v-else>
                    <template v-if="ja && kanji">もっと聞く</template>
                    <template v-else-if="ja">もっときく</template>
                    <template v-else>Continue listening</template>
                </template>
            </button>
            <button v-else>
                <template v-if="ja && kanji">聞く</template>
                <template v-else-if="ja">きく</template>
                <template v-else>Listen</template>
            </button>
            <button @click="toggleShowAnswer">
                <template v-if="ja && kanji">答えを<template v-if="showAnswer">隠す</template><template v-else>見せる</template></template>
                <template v-else-if="ja">こたえを<template v-if="showAnswer">かくす</template><template v-else>みせる</template></template>
                <template v-else><template v-if="showAnswer">Hide</template><template v-else>Show</template> answer</template>
            </button>
            <span v-if="showAnswer">{{ problemWithAnswer }}</span>
        </template>
        <template v-if="false">
            <!-- debug stuff -->
            <span>
                Speech tokens: {JSON.stringify(speechTokens)}
            </span>
        </template>
    </div>
</template>