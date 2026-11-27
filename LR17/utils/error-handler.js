PS C:\Users\Вячеслав\Desktop\LR17> notepad .\utils\error-handler.js
PS C:\Users\Вячеслав\Desktop\LR17> function handleError(error) {
>>     console.error(`Ошибка: ${error.message}`);
>>
>>     if (process.env.NODE_ENV !== 'production') {
>>         console.error(error.stack);
>>     }
>>
>>     process.exitCode = 1;
>> }
строка:1 знак:22
+ function handleError(error) {
+                      ~
Отсутствует '')'' в списке параметров функции.
строка:1 знак:27
+ function handleError(error) {
+                           ~
Непредвиденная лексема ")" в выражении или операторе.
строка:2 знак:46
+     console.error(`Ошибка: ${error.message}`);
+                                              ~
Отсутствует закрывающий знак ")" в выражении.
    + CategoryInfo          : ParserError: (:) [], ParentContainsErrorRecordException
    + FullyQualifiedErrorId : MissingEndParenthesisInFunctionParameterList

PS C:\Users\Вячеслав\Desktop\LR17>
PS C:\Users\Вячеслав\Desktop\LR17> module.exports = { handleError };