<script lang="ts">
    import { onMount } from 'svelte';

    let { selectedLanguage = $bindable(), kanji = $bindable(), onLanguageChanged, onVoiceChanged, onRateChanged, speakByPart, onSpeechModeChanged } = $props();

    let byLanguage: Record<string, SpeechSynthesisVoice[]> = $state({});

    let lastLanguage: string | undefined = undefined
    let lastVoice: SpeechSynthesisVoice | undefined = undefined
    let selectedVoice: SpeechSynthesisVoice | undefined = $state()

    let lastRate: number = 100
    let ratePct: number = $state(lastRate)

    let ja: boolean = $derived(selectedLanguage == 'ja-JP')

    function loadVoices() {
        // Reset the mapping
        byLanguage = {}
        // Rebuild the mapping
        const localVoices = window.speechSynthesis.getVoices().filter(voice => {
            return voice.localService;
        });
        localVoices.forEach(voice => {
            if (['en-US', 'ja-JP'].indexOf(voice.lang) > -1) {
                byLanguage[voice.lang] ??= []
                byLanguage[voice.lang].push(voice)
            }
        })
        resetLanguage()
        resetVoice()
    }

    function internalOnLanguageChanged(event: any) {
        handleLanguageUpdate()
    }

    function internalOnVoiceChanged(event: any) {
        handleVoiceUpdate()
    }

    function internalOnRateChanged(event: any) {
        handleRateUpdate()
    }

    function handleLanguageUpdate() {
        if (selectedLanguage != lastLanguage) {
            lastLanguage = selectedLanguage
            onLanguageChanged(selectedLanguage)
            resetVoice()
        }
    }

    function handleVoiceUpdate() {
        if (selectedVoice != lastVoice) {
            lastVoice = selectedVoice
            onVoiceChanged(selectedVoice)
        }
    }

    function handleRateUpdate() {
        if (ratePct != lastRate) {
            lastRate = ratePct
            onRateChanged(ratePct)
        }
    }

    function resetLanguage() {
        if (!selectedLanguage) {
            let newLanguage = Object.keys(byLanguage).sort()[0]
            updateLanguage(newLanguage)
        }
    }
    
    function updateLanguage(language: string) {
        selectedLanguage = language;
        handleLanguageUpdate()
    }

    function resetVoice() {
        if (selectedLanguage && Object.hasOwn(byLanguage, selectedLanguage) && byLanguage[selectedLanguage].length > 0) {
            if (selectedVoice === undefined) {
                //console.log('reset voice: voice undefined; selecting default for selected language')
            } else if (byLanguage[selectedLanguage].indexOf(selectedVoice) === -1) {
                //console.log('reset voice: voice does not match selected language; selecting default for selected language')
            } else {
                // Voice is fine; don't touch it!
                return
            }
            // If we get here: reset the voice
            updateVoice(byLanguage[selectedLanguage][0])
        }
    }

    function updateVoice(voice: SpeechSynthesisVoice) {
        selectedVoice = voice
        handleVoiceUpdate()
    }


    function getFriendlyLanguageName(language: string): string {
        const dn = new Intl.DisplayNames([navigator.language], { type: 'language' });
        return dn.of(language) || language
    }

    onMount(() => {
        loadVoices()
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
        return () => {
            window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
        }
    })
</script>

<p>
    {#if Object.keys(byLanguage).length === 0}
        {#if ja && kanji}声をロード中...{:else if ja}こえをロードちゅう...{:else}Loading voices...{/if}
    {:else}
        {#if ja && kanji}言語：{:else if ja}げんご：{:else}Language: {/if}<select bind:value={selectedLanguage} autocomplete="off" onchange={internalOnLanguageChanged}>
            {#each Object.keys(byLanguage).sort() as language}
                <option value="{language}">{getFriendlyLanguageName(language)}</option>
            {/each}
        </select>
        {#if ja && kanji}声：{:else if ja}こえ：{:else}Voice: {/if}<select bind:value={selectedVoice} autocomplete="off" onchange={internalOnVoiceChanged}>
            {#if (typeof selectedLanguage) == "string"}
                {#each byLanguage[selectedLanguage] as voice}
                    <option value={voice}>{voice.name}</option>
                {/each}
            {/if}
        </select>
        {#if ja}スピード（パーセント）：{:else}Speed (percentage): {/if}<input bind:value={ratePct} autocomplete="off" onchange={internalOnRateChanged} type="range" min="10" max="300" /> {ratePct}%
        <input id="speak-by-part" type="checkbox" bind:checked={speakByPart} onchange={onSpeechModeChanged} autocomplete="off"><label for="speak-by-part">{#if ja && kanji}問題を部分で言う{:else if ja}もんだいをぶぶんでいう{:else}Say part-by-part{/if}</label>
    {/if}
    {#if ja}
    <br />
    <input id="kanji" type="checkbox" bind:checked={kanji} autocomplete="off"><label for="kanji">{#if kanji}漢字を使う{:else}かんじをつかう{/if}</label>
    {/if}
</p>