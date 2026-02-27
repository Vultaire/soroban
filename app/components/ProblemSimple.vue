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
    selectedRate: Number,
    speakByPart: Boolean,
})

const emit = defineEmits(['enterPressed'])


const ja = computed(() => props.selectedLanguage == "ja-JP")

const utteranceIndex = ref(0)

const substitutions: Record<string,Record<string,string>> = {
    "en-US": {
        "-": "minus",
        "*": "multiplied by",
        "/": "divided by",
    },
    "ja-JP": {
        "+": "たす",
        "-": "ひく",
        "*": "かける",
        "/": "わる",
    },
}

const validTokensRgx = /(\d+|[\+\-\*\/])/g
const digitRgx = /^\d+$/

function getSanitizedTokens(): string[] {
    /* Very simple: match on numbers (multidigit) and operators (singular).  Commas not (yet) supported. */
    const matches: string[][] = Array.from(problem.value.matchAll(validTokensRgx))
    return matches.map(function (match: string[]): string {
        return match[1]
    })
}

const tokenSubstitutions = computed(() => {
    return substitutions[props.selectedLanguage] || {}
})

const evalTokens = computed(() => {
    const safeTokens = getSanitizedTokens()
    const tempTokens: string[] = []
    const finalTokens: string[] = []

    safeTokens.forEach((token) => {
        tempTokens.push(token)
        if(token.match(digitRgx)) {
            finalTokens.push(tempTokens.join(" "))
            tempTokens.length = 0
        }
    })
    return finalTokens
})

const speechTokens = computed(() => {
    return evalTokens.value.map((token, i) => {
        for (const key in tokenSubstitutions) {
            let value = tokenSubstitutions[key]
            token = token.replace(key, value)
        }
        if (i === evalTokens.value.length - 1) {
            const lastTokenAddition = ja.value ? ' は' : ' is'
            token += lastTokenAddition
        }
        return token
    })
})


function onInputKeyUp(event: KeyboardEvent) {
    if (event.key == "Enter") {
        emit('enterPressed')
    }
}

function toggleShowAnswer() {
    showAnswer.value = !showAnswer.value
}


// "Speak all" handler
function onListenClicked() {
    if (!props.selectedVoice) {
        console.error('onListenClicked: unexpected unset selected voice')
        return
    }

    // For beginners I suspect inserting the comma here should be helpful; it adds just a tiny bit of pause.
    // Maybe not everyone will like it, but for now, let's do it.
    let fullPhrase = speechTokens.value.join(", ")
    speak(fullPhrase)
}

function onListenIncrementalClicked() {
    if (!props.selectedVoice) {
        console.error('onListenClicked: unexpected unset selected voice')
        return
    }

    speak(speechTokens.value[utteranceIndex.value])
    utteranceIndex.value = (utteranceIndex.value + 1) % speechTokens.value.length || 0
}

function speak(phrase: string) {
    if (props.selectedVoice) {
        const utterance = new SpeechSynthesisUtterance(phrase)
        utterance.lang = props.selectedLanguage ?? "en-US"
        utterance.rate = props.selectedRate / 100
        utterance.voice = props.selectedVoice
        window.speechSynthesis.speak(utterance)
    }
}

function sanitizeProblem(): string {
    return getSanitizedTokens().join(" ")
}

const problemWithAnswer = computed(() => {
    const sanitizedProblem = sanitizeProblem()
    let answer: string = "0"
    try {
        if (evalTokens.value.length > 0) {
            answer = eval(evalTokens.value[0]).toString()
        }
        // Simple eval: eval bit by bit.
        // I'm being lazy here and not implementing my own eval logic,
        // instead just re-using each intermediate answer
        // again in an eval expression.
        // My hope is this is "good enough" for this tool, but if not I
        // can always write a more proper parser later to remove the eval() usage.
        for (let i=1; i<evalTokens.value.length; i++) {
            answer = eval([answer, evalTokens.value[i]].join(" ")).toString()
        }
    } catch (error) {
        answer = '<error>'
    }
    return `${sanitizedProblem} = ${answer}`
})

</script>

<style scoped>
    input {
        width: 200px;
    }
</style>

<template>
    <div>
        <input v-if="viewMode == 'edit'" v-model="problem" class="problem-simple" type="text" autocomplete="off" @keyup="onInputKeyUp" />
        <template v-else>
            <button v-if="speakByPart" @click="onListenIncrementalClicked">
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
            <button v-else @click="onListenClicked">
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
                Speech tokens: {{ JSON.stringify(speechTokens) }}
            </span>
        </template>
    </div>
</template>