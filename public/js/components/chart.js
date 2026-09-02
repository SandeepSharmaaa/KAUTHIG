function renderBarChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    if (!data || data.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', width / 2, height / 2);
        return;
    }
    
    const { barColor = '#2563eb', title = '', yAxisLabel = '' } = options;
    
    const padding = 40;
    const bottomPadding = 60;
    const topPadding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - bottomPadding - topPadding;
    
    // Find max value
    const maxValue = Math.max(...data.map(d => d.value), 10); // at least 10
    
    // Draw title
    if (title) {
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, 20);
    }
    
    // Draw axes
    ctx.beginPath();
    ctx.moveTo(padding, topPadding);
    ctx.lineTo(padding, height - bottomPadding);
    ctx.lineTo(width - padding, height - bottomPadding);
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();
    
    // Draw grid lines and Y-axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
        const y = height - bottomPadding - (i / gridSteps) * chartHeight;
        const val = Math.round((i / gridSteps) * maxValue);
        
        ctx.fillText(val, padding - 10, y);
        
        if (i > 0) {
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.strokeStyle = '#f1f5f9';
            ctx.stroke();
        }
    }
    
    if (yAxisLabel) {
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(yAxisLabel, 0, 0);
        ctx.restore();
    }
    
    // Draw bars
    const barSpacing = chartWidth / data.length;
    const barWidth = Math.min(barSpacing * 0.6, 40);
    
    ctx.fillStyle = barColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    data.forEach((item, index) => {
        const barHeight = (item.value / maxValue) * chartHeight;
        const x = padding + (index * barSpacing) + (barSpacing - barWidth) / 2;
        const y = height - bottomPadding - barHeight;
        
        // Draw bar
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Draw X-axis label
        ctx.save();
        ctx.translate(x + barWidth / 2, height - bottomPadding + 10);
        ctx.rotate(-Math.PI / 4);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#64748b';
        ctx.fillText(item.label, 0, 0);
        ctx.restore();
    });
}
