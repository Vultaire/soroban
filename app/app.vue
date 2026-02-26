<script setup lang="ts">

const title = ref("")  /* Will use this later */

// let selectedLanguage: string | undefined = $state(page.url.searchParams.get('language') || 'en-US')
const selectedLanguage = ref("en-US")
const ja = computed(() => selectedLanguage.value == "ja-JP")
const kanji = ref(true)
const speakByPart = ref(true)
const ratePct = ref(100)

const selectedVoice = ref(null)

const viewMode = ref("edit") // for now...

const allAnswersVisible = ref(false)

function newProblem() {
    return {problem: "", showAnswer: false}
}
const problems = ref([newProblem()])

// Due to https://github.com/nuxt/content/issues/1919 (stale but present issue), useHeadSafe won't work here.
// However, we're not touching innerHTML or similar attributes, so I think it'll be OK in our case to use stock useHead.
useHead({
  /* FIXME: Make this properly reactive! */
  title: computed(() => title.value ? title.value : (ja.value ? "そろばん：よみあげざんツール" : "Soroban reader")),
})

function problemEnterPressed(index: number) {
    if (index == problems.value.length - 1) {
        // We're on the last problem; add a new box for us to move to
        addProblem()
    }
    // Focus on the next problem.
    nextTick().then(() => {
        const elements: NodeListOf<HTMLElement> = document.querySelectorAll('input.problem-simple')
        elements[index+1].focus()
    })
}

function addProblem() {
    problems.value.push(newProblem())
}

function clearAllProblems() {
    // Reset problems to a single empty item.
    if (confirm("Are you sure you wish to clear all problems?")) {
        problems.value = [newProblem()]
    }
}

</script>

<style>
    span.mono {
        font-family: monospace;
        background-color: #CCCCCC;
    }
    table {
        border-spacing: 0px 1em;
    }
</style>

<template>
    <NuxtRouteAnnouncer />
    <template v-if="ja">ページのタイトル：</template>
    <template v-else>Title for this page: </template>
    <input v-model="title" autocomplete="off" />  <!-- on title changed: to do -->
    <!-- <VoiceSelector bind:selectedLanguage bind:kanji {onLanguageChanged} {onVoiceChanged} {onRateChanged} {speakByPart} {onSpeechModeChanged} /> -->
    <VoiceSelector
        v-model:selected-language="selectedLanguage"
        v-model:selected-voice="selectedVoice"
        v-model:kanji="kanji"
        v-model:speak-by-part="speakByPart"
        v-model:rate-pct="ratePct"
        />
    <hr />
    <input v-model="viewMode" type="radio" name="mode" id="edit" value="edit" autocomplete="off" />
    <label for="edit">
        <template v-if="ja && kanji">編集モード</template>
        <template v-else-if="ja">へんしゅうモード</template>
        <template v-else>Edit mode</template>
    </label>

    <input v-model="viewMode" type="radio" name="mode" id="practice" value="practice" autocomplete="off" />
    <label for="practice">
        <template v-if="ja && kanji">練習モード</template>
        <template v-else-if="ja">れんしゅうモード</template>
        <template v-else>Practice mode</template>
    </label>

    <template v-if="viewMode === 'edit'">
        <p v-if="ja && kanji">問題を一個ずつ記入してください。半角の数字、「+」、「-」、「*」、「/」は大丈夫です。例えば：<span class="mono">123+45-67</span>。()を使えません。計算は簡単の「左から右順」です。</p>
        <p v-else-if="ja">もんだいをいっこずつきにゅうしてください。はんかくのすうじ、「+」、「-」、「*」、「/」はだいじょうぶです。たとえば：<span class="mono">123+45-67</span>。()をつかえません。けいさんはかんたんの「ひだりからみぎじゅん」です。</p>
        <p v-else>Input problems one-by-one, using numbers and +-*/ characters, e.g. <span class="mono">123+45-67</span>.  (No commas, no parenthesis.  Note that solutions are calculated in simple left-to-right order.)</p>
    </template>
    <template v-else>
        <p v-if="ja && kanji">問題を再生して、回答して（そろばんでも、暗算でも）、そして答えを確認してください。</p>
        <p v-else-if="ja">もんだいをさいせいして、かいとうして（そろばんでも、あんざんでも）、そしてこたえをかくにんしてください。</p>
        <p v-else>Play back the problems, solve them (soroban or anzan), then check your answers.</p>
    </template>

    <table>
        <tbody>
            <tr v-for="(problemObject, i) in problems">
                <td>{{ i+1 }}. </td>
                <td>
                <ProblemSimple
                    v-model:problem="problemObject.problem"
                    v-model:show-answer="problemObject.showAnswer"
                    :view-mode="viewMode"
                    :selected-language="selectedLanguage"
                    :kanji="kanji"
                    :selected-voice="selectedVoice"
                    :speak-by-part="speakByPart"
                    @enter-pressed="() => problemEnterPressed(i)"
                    />
                </td>
            </tr>
        </tbody>
    </table>

    <template v-if="viewMode === 'edit'">
        <button @click="addProblem">
            <template v-if="ja && kanji">問題を追加する</template>
            <template v-else-if="ja && kanji">もんだいをついかする</template>
            <template v-else>Add problem</template>
        </button>
        <button @click="clearAllProblems">
            <template v-if="ja && kanji">問題を全部消す</template>
            <template v-else-if="ja && kanji">もんだいをぜんぶけす</template>
            <template v-else>Clear all problems</template>
        </button>
    </template>
    <template v-else>
        <button>
            <template v-if="ja && kanji">
                答えを全部<template v-if="allAnswersVisible">隠す</template><template v-else>見せる</template>
            </template>
            <template v-else-if="ja">
                こたえをぜんぶ<template v-if="allAnswersVisible">かくす</template><template v-else>みせる</template>
            </template>
            <template v-else>
                <template v-if="allAnswersVisible">Hide</template><template v-else>Show</template> all answers
            </template>
        </button>
    </template>
</template>
