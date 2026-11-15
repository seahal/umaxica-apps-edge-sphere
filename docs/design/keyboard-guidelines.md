# キーボード操作の準拠方針

**位置づけ：規範。**
`app/core` と `org/core` の UI は、[Apple Human Interface Guidelines の Keyboards](https://developer.apple.com/design/human-interface-guidelines/keyboards) を参照し、キーボード操作を設計、実装、レビューする。
本書は今後の変更に適用する方針であり、既存 UI の準拠確認が完了したことを示すものではない。

## Apple の指針の適用

Apple の指針では、標準ショートカットの尊重、頻繁に使う機能に絞った独自ショートカット、Full Keyboard Access への対応が示されている。
原文の確認日は 2026-10-19 とする。
指針を更新するときや新しいキー割り当てを決めるときは、上記の一次資料を再確認する。

本リポジトリでは、これらをブラウザー上の Core UI に適用する。
Apple のネイティブ API や iPadOS のフォーカス制御に固有の説明は、そのまま Web の実装要件にはしない。
特に iPadOS のネイティブコントロールに関する注意書きを理由に、HTML のボタンをキーボードで操作できなくしてはならない。
