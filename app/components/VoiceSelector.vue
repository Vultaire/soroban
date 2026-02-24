<script setup lang="ts">

const selectedLanguage = defineModel('selectedLanguage')
const selectedVoice = defineModel('selectedVoice')
const kanji = defineModel('kanji')

const ja = computed(() => selectedLanguage.value == "ja-JP")
const speakByPart = ref(true)
const ratePct = ref(100)

const byLanguage = ref({} as Record<string, SpeechSynthesisVoice[]>)

function loadVoices() {
    // This should be straightforward, but due to a Firefox bug
    // (https://bugzilla.mozilla.org/show_bug.cgi?id=1237082), it is not.
    // Sometimes window.speechSynthesis.getVoices() will return an empty list,
    // and no voiceschanged handler fires to indicate that the voices have finally been loaded.
    // Thus, we need to work around this issue asynchronously.

    let attempts = 0;
    const intervalMs = 100
    const maxAttempts = 50;
    function tryLoadVoices() {
        attempts += 1
        if (!loadVoicesInner() && attempts < maxAttempts) {
            window.setTimeout(tryLoadVoices, intervalMs)
        }
    }
    tryLoadVoices()

    // Register a handler in case voices change later
    window.addEventListener("voiceschanged", loadVoicesInner)
}

function loadVoicesInner(): boolean {
    const unfilteredVoices = window.speechSynthesis.getVoices()
    if (unfilteredVoices.length === 0) {
        return false
    }
    // Reset the mapping
    byLanguage.value = {}
    // Rebuild the mapping
    const localVoices = unfilteredVoices.filter(voice => {
        return voice.localService;
    });
    localVoices.forEach(voice => {
        if (['en-US', 'ja-JP'].indexOf(voice.lang) > -1) {
            byLanguage.value[voice.lang] ??= []
            byLanguage.value[voice.lang].push(voice)
        }
    })
    resetLanguage()
    resetVoice()
    return true
}

function resetLanguage() {
    if (!selectedLanguage.value) {
        let newLanguage = Object.keys(byLanguage.value).sort()[0]
        selectedLanguage.value = newLanguage;
    }
}

function resetVoice() {
    if (selectedLanguage.value && Object.hasOwn(byLanguage.value, selectedLanguage.value) && byLanguage.value[selectedLanguage.value].length > 0) {
        if (selectedVoice.value === undefined) {
            //console.log('reset voice: voice undefined; selecting default for selected language')
        } else if (byLanguage.value[selectedLanguage.value].indexOf(selectedVoice.value) === -1) {
            //console.log('reset voice: voice does not match selected language; selecting default for selected language')
        } else {
            // Voice is fine; don't touch it!
            return
        }
        // If we get here: reset the voice
        selectedVoice.value = byLanguage.value[selectedLanguage.value][0]
    }
}

function getFriendlyLanguageName(language: string): string {
    const dn = new Intl.DisplayNames([navigator.language], { type: 'language' });
    return dn.of(language) || language
}

watch(selectedLanguage, (newLang, oldLang) => {
    //console.log(`watcher for selectedLanguage: ${oldLang} -> ${newLang}`)
    if (newLang !== oldLang) {
        resetVoice()
    }
})

onMounted(() => {
    loadVoices()
})
onBeforeUnmount(() => {
    // Just in case this gets registered, remove it.
    window.removeEventListener('voiceschanged', loadVoicesInner)
})
</script>

<template>
    <div>
        <template v-if="Object.keys(byLanguage).length === 0">
            <template v-if="ja && kanji">声をロード中...</template>
            <template v-else-if="ja">こえをロードちゅう...</template>
            <template v-else>Loading voices...</template>
        </template>
        <div v-else>
            <div>
                <template v-if="ja && kanji">言語：</template>
                <template v-else-if="ja">げんご：</template>
                <template v-else>Language: </template>
                <select v-model="selectedLanguage" autocomplete="off">
                    <option v-for="language in Object.keys(byLanguage).sort()" :value="language">{{ getFriendlyLanguageName(language) }}</option>
                </select>
            </div>
            <div>
                <template v-if="ja && kanji">声：</template>
                <template v-else-if="ja">こえ：</template>
                <template v-else>Voice: </template>
                <select v-model="selectedVoice" autocomplete="off">
                    <option v-for="voice in byLanguage[selectedLanguage]" :value="voice">{{ voice.name }}</option>
                </select>
                <template v-if="ja">スピード（パーセント）：</template>
                <template v-else>Speed (percentage): </template>
                <input v-model="ratePct" autocomplete="off" type="range" min="10" max="300" /> {{ ratePct }}%
            </div>
        </div>
        <div v-if="ja">
            <input id="kanji" type="checkbox" v-model="kanji" autocomplete="off">
            <label for="kanji">
                <template v-if="kanji">漢字を使う</template>
                <template v-else>かんじをつかう</template>
            </label>
        </div>
        <div>
            <input id="speak-by-part" type="checkbox" v-model="speakByPart" autocomplete="off">
            <label for="speak-by-part">
                <template v-if="ja && kanji">問題を部分で言う</template>
                <template v-else-if="ja">もんだいをぶぶんでいう</template>
                <template v-else>Say part-by-part</template>
            </label>
        </div>
    </div>

</template>
