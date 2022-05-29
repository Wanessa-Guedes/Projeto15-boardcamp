function twoDigits(num) {
    return num.toString().padStart(2, '0');
}

export function formatedDate(date) {
    return [
        date.getFullYear(),
        twoDigits(date.getMonth() + 1),
        twoDigits(date.getDate())
    ].join('-');
};

