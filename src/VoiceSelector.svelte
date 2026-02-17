<script lang="ts">
    import { onMount } from 'svelte';

    let { onLanguageChanged, onVoiceChanged, onRateChanged } = $props();

    let byLanguage: Record<string, SpeechSynthesisVoice[]> = $state({});

    let lastLanguage: string | undefined = undefined
    let selectedLanguage: string | undefined = $state()
    let lastVoice: SpeechSynthesisVoice | undefined = undefined
    let selectedVoice: SpeechSynthesisVoice | undefined = $state()

    let lastRate: number = 100
    let ratePct: number = $state(lastRate)

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
        if (selectedLanguage) {
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
        Loading voices…
    {:else}
        Language: <select bind:value={selectedLanguage} onchange={internalOnLanguageChanged}>
            {#each Object.keys(byLanguage).sort() as language}
                <option value="{language}">{getFriendlyLanguageName(language)}</option>
            {/each}
        </select>
        Voice: <select bind:value={selectedVoice} onchange={internalOnVoiceChanged}>
            {#if (typeof selectedLanguage) == "string"}
                {#each byLanguage[selectedLanguage] as voice}
                    <option value={voice}>{voice.name}</option>
                {/each}
            {/if}
        </select>
        Rate (percentage): <input bind:value={ratePct} onchange={internalOnRateChanged} type="range" min="10" max="300" /> {ratePct}%
    {/if}
</p>
