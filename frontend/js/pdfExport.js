// js/pdfExport.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export class PDFExporter {
    static generateQuotation(project, customerInfo, totals) {
        const doc = new jsPDF();
        
        // Заглавие
        doc.setFontSize(20);
        doc.setTextColor(102, 126, 234);
        doc.text('Оферта за кухненски мебели', 105, 20, null, null, 'center');
        
        // Информация за клиента
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Клиент: ${customerInfo.name}`, 20, 40);
        doc.text(`Дата: ${new Date().toLocaleDateString('bg-BG')}`, 20, 50);
        
        // Таблица със шкафове
        const tableData = project.map((cabinet, index) => [
            index + 1,
            cabinet.type,
            `${cabinet.width}x${cabinet.height}x${cabinet.depth}mm`,
            cabinet.cabinet_id || '-',
            `${this.calculateCabinetPrice(cabinet).toFixed(2)} лв.`
        ]);
        
        doc.autoTable({
            startY: 60,
            head: [['№', 'Тип шкаф', 'Размери', 'ID', 'Цена']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [102, 126, 234] }
        });
        
        // Обща сума
        const finalY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`Обща сума: ${totals.total.toFixed(2)} лв.`, 20, finalY);
        doc.text(`ДДС (20%): ${totals.vat.toFixed(2)} лв.`, 20, finalY + 10);
        doc.text(`Крайна цена: ${(totals.total + totals.vat).toFixed(2)} лв.`, 20, finalY + 20);
        
        // Условия
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Условия:', 20, finalY + 40);
        doc.text('1. Цените са в лева без ДДС', 25, finalY + 50);
        doc.text('2. Срок на изпълнение: 14 работни дни', 25, finalY + 60);
        doc.text('3. Гаранция: 24 месеца', 25, finalY + 70);
        
        // Запазване на файла
        doc.save(`оферта_${customerInfo.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    }
    
    static calculateCabinetPrice(cabinet) {
        // Базова цена + цена за материали
        const basePrice = 150; // Примерна базова цена
        const materialPrice = (cabinet.width * cabinet.height * cabinet.depth) / 1000000 * 100;
        return basePrice + materialPrice;
    }
}