# build_data.ps1 - Pure ASCII code generating clean UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$trPath = "latin_core_tr.csv"
$enPath = "latin_core_en.csv"

# Use Microsoft.VisualBasic.FileIO.TextFieldParser to parse CSV correctly
Add-Type -AssemblyName Microsoft.VisualBasic

function Parse-CsvLines($filePath) {
    $parser = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($filePath, [System.Text.Encoding]::UTF8)
    $parser.TextFieldType = [Microsoft.VisualBasic.FileIO.FieldType]::Delimited
    $parser.SetDelimiters(",")
    $parser.HasFieldsEnclosedInQuotes = $true
    
    $rows = @()
    $header = $parser.ReadFields()
    while (!$parser.EndOfData) {
        $fields = $parser.ReadFields()
        $rows += ,$fields
    }
    $parser.Close()
    return $rows
}

$trRows = Parse-CsvLines (Resolve-Path $trPath).Path
$enRows = Parse-CsvLines (Resolve-Path $enPath).Path

function Clean-Lemma($headword) {
    if ([string]::IsNullOrWhiteSpace($headword)) { return "" }
    $hw = $headword.Trim()
    
    # Common multi-word lemmas
    if ($hw.StartsWith([char]0x0101 + " ab") -or $hw.StartsWith("a ab")) { return "ab" }
    if ($hw.StartsWith("e ex") -or $hw.StartsWith([char]0x0113 + " ex")) { return "ex" }
    if ($hw.StartsWith("ut,") -or $hw.StartsWith("ut ")) { return "ut" }
    if ($hw.StartsWith("atque")) { return "atque" }

    # Get first word
    $parts = $hw -split "[\s,/\(\)]+"
    $first = $parts[0]
    
    # De-macron
    $chars = $first.ToCharArray()
    $sb = New-Object System.Text.StringBuilder
    foreach ($c in $chars) {
        $code = [int]$c
        # a with macron 257 (0x0101) -> a (97)
        if ($code -eq 257 -or $code -eq 256) { [void]$sb.Append('a') }
        # e with macron 275 (0x0113) -> e (101)
        elseif ($code -eq 275 -or $code -eq 274) { [void]$sb.Append('e') }
        # i with macron 299 (0x012B) -> i (105)
        elseif ($code -eq 299 -or $code -eq 298) { [void]$sb.Append('i') }
        # o with macron 333 (0x014D) -> o (111)
        elseif ($code -eq 333 -or $code -eq 332) { [void]$sb.Append('o') }
        # u with macron 363 (0x016B) -> u (117)
        elseif ($code -eq 363 -or $code -eq 362) { [void]$sb.Append('u') }
        # y with macron 563 (0x0233) -> y (121)
        elseif ($code -eq 563 -or $code -eq 562) { [void]$sb.Append('y') }
        else {
            if ([char]::IsLetter($c)) {
                [void]$sb.Append([char]::ToLowerInvariant($c))
            }
        }
    }
    return $sb.ToString()
}

function Get-PosGroup($posEn) {
    if ($posEn.StartsWith("Verb")) { return "Fiil" }
    if ($posEn.StartsWith("Noun")) { return ("{0}sim" -f [char]0x0130) }
    if ($posEn.StartsWith("Adjective")) { return ("S{0}fat" -f [char]0x0131) }
    if ($posEn.StartsWith("Adverb")) { return "Zarf" }
    if ($posEn.StartsWith("Preposition")) { return "Edat" }
    if ($posEn.StartsWith("Conjunction")) { return ("Ba{0}la{1}" -f [char]0x011F, [char]0x00E7) }
    if ($posEn.StartsWith("Pronoun")) { return "Zamir" }
    return ("Di{0}er" -f [char]0x011F)
}

$items = @()

for ($i = 0; $i -lt $trRows.Count; $i++) {
    $trF = $trRows[$i]
    $enF = $enRows[$i]
    
    $hw = $trF[0].Trim()
    $defTr = $trF[1].Trim()
    $posTr = $trF[2].Trim()
    $catTr = $trF[3].Trim()
    $rank = [int]$trF[4].Trim()
    
    $defEn = $enF[1].Trim()
    $posEn = $enF[2].Trim()
    $catEn = $enF[3].Trim()
    
    $lemma = Clean-Lemma $hw
    $logeion = "https://logeion.uchicago.edu/$lemma"
    $posGroup = Get-PosGroup $posEn
    
    $obj = [PSCustomObject]@{
        id = $i + 1
        rank = $rank
        headword = $hw
        lemma = $lemma
        pos_tr = $posTr
        pos_en = $posEn
        pos_group = $posGroup
        cat_tr = $catTr
        cat_en = $catEn
        def_tr = $defTr
        def_en = $defEn
        logeion_url = $logeion
    }
    $items += $obj
}

# Sort by rank ascending
$sorted = $items | Sort-Object { $_.rank }

# Assign set_no (20 words per set, up to 50 sets)
for ($k = 0; $k -lt $sorted.Count; $k++) {
    $set = [math]::Floor($k / 20) + 1
    $sorted[$k] | Add-Member -MemberType NoteProperty -Name "set_no" -Value $set
    $sorted[$k] | Add-Member -MemberType NoteProperty -Name "is_term_target" -Value ($k -lt 400)
}

if (!(Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" | Out-Null
}

$json = ConvertTo-Json -InputObject $sorted -Depth 5 -Compress:$false
$jsContent = "// Latin Core Vocabulary Dataset (997 words)
// Sources: Dickinson College Commentaries (LASLA data) & Logeion (Lewis & Short)
// Turkish Translations: Mert Inan & Emin Comoglu (Istanbul University)
// Prepared for Latince Ekinoks / Istanbul University Classical Philology

window.LATIN_CORE_DATA = " + $json + ";"

[System.IO.File]::WriteAllText("data/latin_core_data.js", $jsContent, [System.Text.Encoding]::UTF8)

Write-Host "SUCCESS: Generated data/latin_core_data.js with $($sorted.Count) items!"
