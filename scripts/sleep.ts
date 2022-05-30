// exposed sleep function
export default function(ms: number){
    return new Promise<void>(resolve => {
        setTimeout(resolve, ms);
    });
}
